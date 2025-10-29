import crypto from "crypto";

import { HttpError } from "../../utils/http.js";
import { insertAudit } from "../common/audit.util.js";
import type { FeedScope } from "./feed.repository.js";
import {
  findActiveShareLinkBySession,
  findFeedItemById,
  findFeedItemBySessionId,
  findSessionById,
  findShareLinkByToken,
  insertFeedItem,
  insertShareLink,
  listFeedSessions,
  incrementShareLinkView,
  revokeShareLinksForSession,
  updateFeedItem,
  upsertFollower,
  deleteFollower,
  listFollowers,
  listFollowing,
  upsertFeedLike,
  deleteFeedLike,
  getFeedItemStats,
  findUserLikedFeedItems,
  upsertBookmark,
  deleteBookmark,
  findUserBookmarkedSessions,
  listBookmarkedSessions,
  listCommentsForFeedItem,
  insertComment,
  findCommentById,
  getCommentWithAuthor,
  softDeleteComment,
  hasBlockRelation,
  insertBlock,
  deleteBlock,
  insertFeedReport,
  getLeaderboardRows,
  type FeedItemStats,
  type BookmarkRow,
  type CommentRow,
  type LeaderboardRow,
  type SessionRow,
} from "./feed.repository.js";
import { updateSession } from "../sessions/sessions.repository.js";
import { cloneOne } from "../sessions/sessions.service.js";
import { findUserByUsername } from "../users/users.repository.js";

export interface FeedListResult {
  items: Array<{
    feedItemId: string;
    ownerId: string;
    ownerUsername: string;
    ownerDisplayName: string;
    visibility: string;
    publishedAt: string | null;
    session: null | {
      id: string;
      title: string | null;
      completedAt: string | null;
      points: number | null;
    };
    stats: {
      likes: number;
      comments: number;
      viewerHasLiked: boolean;
      viewerHasBookmarked: boolean;
    };
  }>;
}

export async function getFeed({
  viewerId,
  scope = "public",
  limit,
  offset,
}: {
  viewerId?: string | null;
  scope?: FeedScope;
  limit?: number;
  offset?: number;
}): Promise<FeedListResult> {
  const normalizedScope: FeedScope = scope === "me" || scope === "following" ? scope : "public";

  if ((normalizedScope === "me" || normalizedScope === "following") && !viewerId) {
    throw new HttpError(
      401,
      "E.FEED.AUTH_REQUIRED",
      "FEED_AUTH_REQUIRED",
    );
  }

  const rows = await listFeedSessions({
    viewerId,
    scope: normalizedScope,
    limit,
    offset,
  });

  const feedItemIds = rows.map((row) => row.feed_item_id);
  const sessionIds = rows
    .map((row) => row.session_id)
    .filter((value): value is string => Boolean(value));
  const statsMap = await getFeedItemStats(feedItemIds);
  const viewerLikes = viewerId ? await findUserLikedFeedItems(viewerId, feedItemIds) : new Set();
  const viewerBookmarks = viewerId
    ? await findUserBookmarkedSessions(viewerId, sessionIds)
    : new Set();

  return {
    items: rows.map((row) => ({
      feedItemId: row.feed_item_id,
      ownerId: row.owner_id,
      ownerUsername: row.owner_username,
      ownerDisplayName: row.owner_display_name,
      visibility: row.visibility,
      publishedAt: row.published_at,
      session: row.session_id
        ? {
            id: row.session_id,
            title: row.session_title,
            completedAt: row.session_completed_at,
            points: row.session_points,
          }
        : null,
      stats: {
        likes: statsMap.get(row.feed_item_id)?.likes ?? 0,
        comments: statsMap.get(row.feed_item_id)?.comments ?? 0,
        viewerHasLiked: viewerLikes.has(row.feed_item_id),
        viewerHasBookmarked: row.session_id !== null ? viewerBookmarks.has(row.session_id) : false,
      },
    })),
  };
}

async function loadFeedItemOrThrow(feedItemId: string) {
  const feedItem = await findFeedItemById(feedItemId);
  if (!feedItem) {
    throw new HttpError(404, "E.FEED.ITEM_NOT_FOUND", "FEED_ITEM_NOT_FOUND");
  }
  return feedItem;
}

async function ensureFeedInteractionAllowed(actorId: string, ownerId: string, visibility: string) {
  if (await hasBlockRelation(actorId, ownerId)) {
    throw new HttpError(403, "E.FEED.BLOCKED", "FEED_BLOCKED");
  }
  if (ownerId !== actorId && visibility !== "public") {
    throw new HttpError(403, "E.FEED.NOT_PUBLIC", "FEED_NOT_PUBLIC");
  }
}

async function loadSessionOrThrow(sessionId: string) {
  const session = await findSessionById(sessionId);
  if (!session) {
    throw new HttpError(404, "E.FEED.SESSION_NOT_FOUND", "FEED_SESSION_NOT_FOUND");
  }
  return session;
}

async function ensureSessionInteractionAllowed(actorId: string, session: SessionRow) {
  if (await hasBlockRelation(actorId, session.owner_id)) {
    throw new HttpError(403, "E.FEED.BLOCKED", "FEED_BLOCKED");
  }
  if (session.owner_id !== actorId && session.visibility !== "public") {
    throw new HttpError(403, "E.FEED.NOT_PUBLIC", "Session is not public");
  }
}

function loadModerationBlocklist(): string[] {
  const raw = process.env.FEED_BLOCKED_KEYWORDS || "";
  return raw
    .split(",")
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);
}

async function fetchStatsForFeedItem(feedItemId: string): Promise<FeedItemStats> {
  const map = await getFeedItemStats([feedItemId]);
  return map.get(feedItemId) ?? { likes: 0, comments: 0 };
}

function normalizeReason(input: string) {
  const trimmed = (input ?? "").trim();
  if (trimmed.length === 0) {
    throw new HttpError(400, "E.FEED.REPORT_REASON_REQUIRED", "FEED_REPORT_REASON_REQUIRED");
  }
  if (trimmed.length > 200) {
    throw new HttpError(422, "E.FEED.REPORT_REASON_TOO_LONG", "FEED_REPORT_REASON_TOO_LONG");
  }
  return trimmed;
}

function sanitizeDetails(details?: string | null) {
  if (!details) {
    return null;
  }
  const trimmed = details.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.slice(0, 500);
}

export interface ShareLinkOptions {
  maxViews?: number | null;
  expiresAt?: Date | null;
}

export async function createShareLink(
  userId: string,
  sessionId: string,
  options: ShareLinkOptions = {},
) {
  const session = await findSessionById(sessionId);
  if (!session) {
    throw new HttpError(404, "E.FEED.SESSION_NOT_FOUND", "FEED_SESSION_NOT_FOUND");
  }
  if (session.owner_id !== userId) {
    throw new HttpError(403, "E.FEED.NOT_OWNER", "FEED_NOT_OWNER");
  }
  if (session.status !== "completed") {
    throw new HttpError(400, "E.FEED.INVALID_STATUS", "FEED_INVALID_STATUS");
  }

  let feedItem = await findFeedItemBySessionId(sessionId);
  if (!feedItem) {
    feedItem = await insertFeedItem({
      ownerId: session.owner_id,
      sessionId,
      visibility: session.visibility === "public" ? "public" : "link",
      publishedAt: session.completed_at ?? new Date(),
    });
  }

  const existing = await findActiveShareLinkBySession(sessionId);
  if (existing) {
    return existing;
  }

  const token = crypto.randomBytes(24).toString("base64url");
  const link = await insertShareLink({
    sessionId,
    feedItemId: feedItem.id,
    token,
    createdBy: userId,
    maxViews: options.maxViews ?? null,
    expiresAt: options.expiresAt ?? null,
  });

  const targetVisibility = session.visibility === "public" ? "public" : "link";
  await updateFeedItem(feedItem.id, {
    visibility: targetVisibility,
    published_at: session.completed_at ?? new Date().toISOString(),
  });

  if (session.visibility === "private") {
    await updateSession(sessionId, userId, { visibility: "link" });
  }

  await insertAudit({
    actorUserId: userId,
    entity: "sessions",
    action: "share_link.create",
    entityId: sessionId,
    metadata: {
      share_link_id: link.id,
      max_views: link.max_views,
      expires_at: link.expires_at,
    },
  });

  return link;
}

function ensureShareLinkIsActive(link: {
  revoked_at: string | null;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
}) {
  if (link.revoked_at) {
    throw new HttpError(404, "E.FEED.LINK_REVOKED", "FEED_LINK_REVOKED");
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    throw new HttpError(404, "E.FEED.LINK_EXPIRED", "FEED_LINK_EXPIRED");
  }
  if (link.max_views !== null && link.view_count >= link.max_views) {
    throw new HttpError(404, "E.FEED.LINK_EXHAUSTED", "FEED_LINK_EXHAUSTED");
  }
}

export async function getSharedSession(token: string) {
  const link = await findShareLinkByToken(token);
  if (!link) {
    throw new HttpError(404, "E.FEED.LINK_NOT_FOUND", "FEED_LINK_NOT_FOUND");
  }

  ensureShareLinkIsActive(link);

  let session = null;
  let feedItem = null;

  if (link.feed_item_id) {
    feedItem = await findFeedItemById(link.feed_item_id);
    if (feedItem?.session_id) {
      session = await findSessionById(feedItem.session_id);
    }
  }

  if (!session && link.session_id) {
    session = await findSessionById(link.session_id);
  }

  if (!session || session.status !== "completed") {
    throw new HttpError(404, "E.FEED.SESSION_NOT_FOUND", "FEED_SESSION_NOT_FOUND");
  }

  if (!feedItem) {
    feedItem = await findFeedItemBySessionId(session.id);
  }

  await incrementShareLinkView(link.id);

  return {
    link: {
      ...link,
      view_count: link.view_count + 1,
    },
    feedItem,
    session,
  };
}

export async function revokeShareLink(userId: string, sessionId: string) {
  const session = await findSessionById(sessionId);
  if (!session) {
    throw new HttpError(404, "E.FEED.SESSION_NOT_FOUND", "FEED_SESSION_NOT_FOUND");
  }
  if (session.owner_id !== userId) {
    throw new HttpError(403, "E.FEED.NOT_OWNER", "FEED_NOT_OWNER");
  }

  const feedItem = await findFeedItemBySessionId(sessionId);
  const revokedCount = await revokeShareLinksForSession(sessionId);

  if (revokedCount > 0 && session.visibility === "link") {
    await updateSession(sessionId, userId, { visibility: "private" });
    if (feedItem) {
      await updateFeedItem(feedItem.id, { visibility: "private" });
    }
  }

  await insertAudit({
    actorUserId: userId,
    entity: "sessions",
    action: "share_link.revoke",
    entityId: sessionId,
    metadata: {
      revoked_count: revokedCount,
    },
  });

  return revokedCount;
}

export async function cloneSessionFromFeed(
  userId: string,
  sourceSessionId: string,
  payload: Record<string, unknown> = {},
) {
  return cloneOne(userId, sourceSessionId, {
    ...payload,
  });
}

export async function followUserByAlias(
  followerId: string,
  alias: string,
): Promise<{ followingId: string }> {
  const targetUser = await findUserByUsername(alias);
  if (!targetUser) {
    throw new HttpError(404, "E.FEED.USER_NOT_FOUND", "FEED_USER_NOT_FOUND");
  }
  if (targetUser.id === followerId) {
    throw new HttpError(400, "E.FEED.CANNOT_FOLLOW_SELF", "FEED_CANNOT_FOLLOW_SELF");
  }

  await upsertFollower(followerId, targetUser.id);

  return { followingId: targetUser.id };
}

export async function unfollowUserByAlias(
  followerId: string,
  alias: string,
): Promise<{ unfollowedId: string }> {
  const targetUser = await findUserByUsername(alias);
  if (!targetUser) {
    throw new HttpError(404, "E.FEED.USER_NOT_FOUND", "FEED_USER_NOT_FOUND");
  }
  if (targetUser.id === followerId) {
    return { unfollowedId: targetUser.id };
  }

  await deleteFollower(followerId, targetUser.id);

  return { unfollowedId: targetUser.id };
}

export async function listUserFollowers(alias: string) {
  const targetUser = await findUserByUsername(alias);
  if (!targetUser) {
    throw new HttpError(404, "E.FEED.USER_NOT_FOUND", "FEED_USER_NOT_FOUND");
  }
  const rows = await listFollowers(targetUser.id);
  return rows.map((row) => ({
    id: row.follower_id,
    username: row.follower_username,
    displayName: row.follower_display_name,
    followedAt: row.followed_at,
  }));
}

export async function listUserFollowing(alias: string) {
  const targetUser = await findUserByUsername(alias);
  if (!targetUser) {
    throw new HttpError(404, "E.FEED.USER_NOT_FOUND", "FEED_USER_NOT_FOUND");
  }
  const rows = await listFollowing(targetUser.id);
  return rows.map((row) => ({
    id: row.following_id,
    username: row.following_username,
    displayName: row.following_display_name,
    followedAt: row.followed_at,
  }));
}
export async function likeFeedItem(
  userId: string,
  feedItemId: string,
): Promise<{ liked: boolean; stats: FeedItemStats }> {
  const feedItem = await loadFeedItemOrThrow(feedItemId);
  await ensureFeedInteractionAllowed(userId, feedItem.owner_id, feedItem.visibility);

  await upsertFeedLike(feedItemId, userId);
  const stats = await fetchStatsForFeedItem(feedItemId);

  await insertAudit({
    actorUserId: userId,
    entity: "feed_items",
    action: "feed.like",
    entityId: feedItemId,
    metadata: {
      owner_id: feedItem.owner_id,
    },
  });

  return { liked: true, stats };
}

export async function unlikeFeedItem(
  userId: string,
  feedItemId: string,
): Promise<{ liked: boolean; stats: FeedItemStats }> {
  const feedItem = await loadFeedItemOrThrow(feedItemId);
  await ensureFeedInteractionAllowed(userId, feedItem.owner_id, feedItem.visibility);

  const removed = await deleteFeedLike(feedItemId, userId);
  const stats = await fetchStatsForFeedItem(feedItemId);

  if (removed > 0) {
    await insertAudit({
      actorUserId: userId,
      entity: "feed_items",
      action: "feed.unlike",
      entityId: feedItemId,
      metadata: {
        owner_id: feedItem.owner_id,
      },
    });
  }

  return { liked: false, stats };
}

export async function bookmarkSession(
  userId: string,
  sessionId: string,
): Promise<{ bookmarked: boolean }> {
  const session = await loadSessionOrThrow(sessionId);
  await ensureSessionInteractionAllowed(userId, session);

  await upsertBookmark(sessionId, userId);

  await insertAudit({
    actorUserId: userId,
    entity: "sessions",
    action: "feed.bookmark",
    entityId: sessionId,
    metadata: {
      owner_id: session.owner_id,
    },
  });

  return { bookmarked: true };
}

export async function removeBookmark(
  userId: string,
  sessionId: string,
): Promise<{ bookmarked: boolean }> {
  const session = await loadSessionOrThrow(sessionId);
  await ensureSessionInteractionAllowed(userId, session);

  const removed = await deleteBookmark(sessionId, userId);
  if (removed > 0) {
    await insertAudit({
      actorUserId: userId,
      entity: "sessions",
      action: "feed.unbookmark",
      entityId: sessionId,
      metadata: {
        owner_id: session.owner_id,
      },
    });
  }

  return { bookmarked: false };
}

export async function listBookmarks(userId: string, options: { limit?: number; offset?: number }) {
  const rows = await listBookmarkedSessions(userId, options.limit, options.offset);
  return rows.map((row) => ({
    sessionId: row.session_id,
    feedItemId: row.feed_item_id,
    title: row.title,
    completedAt: row.completed_at,
    visibility: row.visibility,
    owner: {
      id: row.owner_id,
      username: row.owner_username,
      displayName: row.owner_display_name,
    },
    points: row.points ?? null,
    bookmarkedAt: row.created_at,
  }));
}

export async function listComments(
  feedItemId: string,
  options: { limit?: number; offset?: number; viewerId?: string } = {},
) {
  const feedItem = await loadFeedItemOrThrow(feedItemId);
  if (options.viewerId) {
    await ensureFeedInteractionAllowed(options.viewerId, feedItem.owner_id, feedItem.visibility);
  } else if (feedItem.visibility !== "public") {
    throw new HttpError(403, "E.FEED.NOT_PUBLIC", "FEED_NOT_PUBLIC");
  }

  const rows = await listCommentsForFeedItem(feedItemId, options.limit, options.offset);

  return rows.map((row) => ({
    id: row.id,
    feedItemId: row.feed_item_id,
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
    },
    body: row.body,
    createdAt: row.created_at,
    editedAt: row.edited_at,
  }));
}

export async function createComment(userId: string, feedItemId: string, body: string) {
  const feedItem = await loadFeedItemOrThrow(feedItemId);
  await ensureFeedInteractionAllowed(userId, feedItem.owner_id, feedItem.visibility);

  const trimmed = (body ?? "").trim();
  if (trimmed.length === 0) {
    throw new HttpError(400, "E.SOCIAL.COMMENT_EMPTY", "SOCIAL_COMMENT_EMPTY");
  }
  if (trimmed.length > 500) {
    throw new HttpError(422, "E.SOCIAL.COMMENT_TOO_LONG", "SOCIAL_COMMENT_TOO_LONG");
  }

  const blocklist = loadModerationBlocklist();
  const lower = trimmed.toLowerCase();
  const flagged = blocklist.find((word) => lower.includes(word));
  if (flagged) {
    throw new HttpError(422, "E.SOCIAL.COMMENT_FORBIDDEN", "SOCIAL_COMMENT_FORBIDDEN");
  }

  const inserted = await insertComment({
    feedItemId,
    userId,
    body: trimmed,
  });

  const enriched = await getCommentWithAuthor(inserted.id);
  if (!enriched) {
    throw new HttpError(500, "E.SOCIAL.COMMENT_LOAD_FAILED", "SOCIAL_COMMENT_LOAD_FAILED");
  }

  await insertAudit({
    actorUserId: userId,
    entity: "feed_items",
    action: "feed.comment",
    entityId: feedItemId,
    metadata: {
      comment_id: inserted.id,
    },
  });

  return {
    id: enriched.id,
    feedItemId: enriched.feed_item_id,
    author: {
      id: enriched.user_id,
      username: enriched.username,
      displayName: enriched.display_name,
    },
    body: enriched.body,
    createdAt: enriched.created_at,
    editedAt: enriched.edited_at,
  };
}

export async function deleteComment(userId: string, commentId: string) {
  const comment = await findCommentById(commentId);
  if (!comment || comment.deleted_at) {
    return { deleted: false };
  }
  const feedItem = await loadFeedItemOrThrow(comment.feed_item_id);

  if (comment.user_id !== userId && feedItem.owner_id !== userId) {
    throw new HttpError(403, "E.SOCIAL.COMMENT_FORBIDDEN", "SOCIAL_COMMENT_FORBIDDEN");
  }

  await softDeleteComment(commentId);
  await insertAudit({
    actorUserId: userId,
    entity: "feed_items",
    action: "feed.comment.delete",
    entityId: comment.feed_item_id,
    metadata: {
      comment_id: commentId,
    },
  });

  return { deleted: true };
}

export async function blockUserByAlias(blockerId: string, alias: string) {
  const target = await findUserByUsername(alias);
  if (!target) {
    throw new HttpError(404, "E.FEED.USER_NOT_FOUND", "FEED_USER_NOT_FOUND");
  }
  if (target.id === blockerId) {
    throw new HttpError(400, "E.FEED.CANNOT_BLOCK_SELF", "FEED_CANNOT_BLOCK_SELF");
  }

  await insertBlock(blockerId, target.id);

  await insertAudit({
    actorUserId: blockerId,
    entity: "users",
    action: "feed.block",
    entityId: target.id,
  });

  return { blockedId: target.id };
}

export async function unblockUserByAlias(blockerId: string, alias: string) {
  const target = await findUserByUsername(alias);
  if (!target) {
    throw new HttpError(404, "E.FEED.USER_NOT_FOUND", "FEED_USER_NOT_FOUND");
  }
  if (target.id === blockerId) {
    return { unblockedId: target.id };
  }

  await deleteBlock(blockerId, target.id);

  await insertAudit({
    actorUserId: blockerId,
    entity: "users",
    action: "feed.unblock",
    entityId: target.id,
  });

  return { unblockedId: target.id };
}

export async function reportFeedItem(
  reporterId: string,
  feedItemId: string,
  reason: string,
  details?: string,
) {
  const feedItem = await loadFeedItemOrThrow(feedItemId);
  await ensureFeedInteractionAllowed(reporterId, feedItem.owner_id, feedItem.visibility);

  const normalizedReason = normalizeReason(reason);
  const sanitizedDetails = sanitizeDetails(details);

  await insertFeedReport({
    reporterId,
    feedItemId,
    reason: normalizedReason,
    details: sanitizedDetails,
  });

  await insertAudit({
    actorUserId: reporterId,
    entity: "feed_items",
    action: "feed.report.item",
    entityId: feedItemId,
    metadata: {
      reason: normalizedReason,
    },
  });

  return { reported: true };
}

export async function reportComment(
  reporterId: string,
  commentId: string,
  reason: string,
  details?: string,
) {
  const comment = await findCommentById(commentId);
  if (!comment || comment.deleted_at) {
    throw new HttpError(404, "E.FEED.COMMENT_NOT_FOUND", "FEED_COMMENT_NOT_FOUND");
  }
  const feedItem = await loadFeedItemOrThrow(comment.feed_item_id);
  await ensureFeedInteractionAllowed(reporterId, feedItem.owner_id, feedItem.visibility);

  const normalizedReason = normalizeReason(reason);
  const sanitizedDetails = sanitizeDetails(details);

  await insertFeedReport({
    reporterId,
    feedItemId: comment.feed_item_id,
    commentId,
    reason: normalizedReason,
    details: sanitizedDetails,
  });

  await insertAudit({
    actorUserId: reporterId,
    entity: "feed_items",
    action: "feed.report.comment",
    entityId: comment.feed_item_id,
    metadata: {
      comment_id: commentId,
      reason: normalizedReason,
    },
  });

  return { reported: true };
}

export async function getLeaderboard(
  viewerId: string | null,
  options: { scope?: "global" | "friends"; period?: "week" | "month"; limit?: number } = {},
) {
  const scope = options.scope ?? "global";
  const period = options.period ?? "week";

  if (scope === "friends" && !viewerId) {
    throw new HttpError(
      401,
      "E.FEED.AUTH_REQUIRED",
      "Authentication required for friends leaderboard",
    );
  }

  const rows = await getLeaderboardRows({
    period,
    scope,
    viewerId: scope === "friends" ? (viewerId ?? undefined) : undefined,
    limit: options.limit ?? 25,
  });

  return rows.map((row, index) => ({
    rank: index + 1,
    user: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
    },
    points: Number(row.points ?? 0),
    badges: Number(row.badges_count ?? 0),
  }));
}
