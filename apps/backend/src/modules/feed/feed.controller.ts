import type { Request, Response } from "express";

import { verifyAccess } from "../../services/tokens.js";
import { HttpError } from "../../utils/http.js";
import {
  blockUserByAlias,
  bookmarkSession,
  cloneSessionFromFeed,
  createComment,
  createShareLink,
  deleteComment,
  followUserByAlias,
  getFeed,
  getLeaderboard,
  getSharedSession,
  likeFeedItem,
  listBookmarks,
  listComments,
  listUserFollowers,
  listUserFollowing,
  removeBookmark,
  reportComment,
  reportFeedItem,
  revokeShareLink,
  unlikeFeedItem,
  unfollowUserByAlias,
  unblockUserByAlias,
} from "./feed.service.js";

function resolveViewerId(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  const token = auth.split(" ")[1];
  try {
    const payload = verifyAccess(token);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

function parseLimit(input: unknown, fallback: number, max: number): number {
  if (input === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(String(input), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function parseOffset(input: unknown, fallback: number): number {
  if (input === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(String(input), 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export async function getFeedHandler(req: Request, res: Response): Promise<void> {
  const viewerId = resolveViewerId(req);
  const scope = (req.query.scope as string | undefined) ?? "public";
  const limit = parseLimit(req.query.limit, 20, 100);
  const offset = parseOffset(req.query.offset, 0);

  const result = await getFeed({
    viewerId,
    scope: scope as any,
    limit,
    offset,
  });

  res.json(result);
}

export async function likeFeedItemHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const result = await likeFeedItem(userId, req.params.feedItemId);
  res.json(result);
}

export async function unlikeFeedItemHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const result = await unlikeFeedItem(userId, req.params.feedItemId);
  res.json(result);
}

export async function bookmarkSessionHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const result = await bookmarkSession(userId, req.params.sessionId);
  res.status(200).json(result);
}

export async function removeBookmarkHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const result = await removeBookmark(userId, req.params.sessionId);
  res.status(200).json(result);
}

export async function listBookmarksHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const limit = parseLimit(req.query.limit, 50, 100);
  const offset = parseOffset(req.query.offset, 0);
  const bookmarks = await listBookmarks(userId, { limit, offset });
  res.json({ bookmarks });
}

export async function listCommentsHandler(req: Request, res: Response): Promise<void> {
  const viewerId = resolveViewerId(req);
  const limit = parseLimit(req.query.limit, 50, 200);
  const offset = parseOffset(req.query.offset, 0);
  const comments = await listComments(req.params.feedItemId, {
    limit,
    offset,
    viewerId: viewerId ?? undefined,
  });
  res.json({ comments });
}

export async function createCommentHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const body = typeof req.body?.body === "string" ? req.body.body : String(req.body?.body ?? "");
  const comment = await createComment(userId, req.params.feedItemId, body);
  res.status(201).json(comment);
}

export async function deleteCommentHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const result = await deleteComment(userId, req.params.commentId);
  res.json(result);
}

export async function blockUserHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const result = await blockUserByAlias(userId, req.params.alias);
  res.json(result);
}

export async function unblockUserHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const result = await unblockUserByAlias(userId, req.params.alias);
  res.json(result);
}

export async function reportFeedItemHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
  const details = typeof req.body?.details === "string" ? req.body.details : undefined;
  const result = await reportFeedItem(userId, req.params.feedItemId, reason, details);
  res.status(201).json(result);
}

export async function reportCommentHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
  const details = typeof req.body?.details === "string" ? req.body.details : undefined;
  const result = await reportComment(userId, req.params.commentId, reason, details);
  res.status(201).json(result);
}

export async function getLeaderboardHandler(req: Request, res: Response): Promise<void> {
  const viewerId = resolveViewerId(req);
  const scope = (req.query.scope as "global" | "friends" | undefined) ?? "global";
  const period = (req.query.period as "week" | "month" | undefined) ?? "week";
  const limit = parseLimit(req.query.limit, 25, 100);
  const leaderboard = await getLeaderboard(viewerId, { scope, period, limit });
  res.json({ leaderboard, scope, period });
}
export async function createShareLinkHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const { maxViews, expiresAt } = req.body ?? {};

  let parsedExpiresAt: Date | null = null;
  if (expiresAt) {
    const candidate = new Date(expiresAt);
    if (Number.isNaN(candidate.getTime())) {
      throw new HttpError(400, "E.FEED.INVALID_EXPIRES_AT", "FEED_INVALID_EXPIRES_AT");
    }
    parsedExpiresAt = candidate;
  }

  const link = await createShareLink(userId, req.params.sessionId, {
    maxViews: typeof maxViews === "number" ? maxViews : null,
    expiresAt: parsedExpiresAt,
  });

  res.status(201).json({
    id: link.id,
    token: link.token,
    maxViews: link.max_views,
    expiresAt: link.expires_at,
    viewCount: link.view_count,
    createdAt: link.created_at,
  });
}

export async function getSharedSessionHandler(req: Request, res: Response): Promise<void> {
  const { link, session, feedItem } = await getSharedSession(req.params.token);

  res.json({
    link: {
      id: link.id,
      maxViews: link.max_views,
      viewCount: link.view_count + 1, // optimistic increment
      expiresAt: link.expires_at,
    },
    feedItem,
    session,
  });
}

export async function revokeShareLinkHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }

  const revoked = await revokeShareLink(userId, req.params.sessionId);
  res.json({ revoked });
}

export async function cloneSessionFromFeedHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }

  const cloned = await cloneSessionFromFeed(userId, req.params.sessionId, req.body ?? {});
  res.status(201).json(cloned);
}

export async function followUserHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const result = await followUserByAlias(userId, req.params.alias);
  res.status(200).json({ followingId: result.followingId });
}

export async function unfollowUserHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpError(401, "E.UNAUTHENTICATED", "UNAUTHENTICATED");
  }
  const result = await unfollowUserByAlias(userId, req.params.alias);
  res.status(200).json({ unfollowedId: result.unfollowedId });
}

export async function listFollowersHandler(req: Request, res: Response): Promise<void> {
  const rows = await listUserFollowers(req.params.alias);
  res.json({ followers: rows });
}

export async function listFollowingHandler(req: Request, res: Response): Promise<void> {
  const rows = await listUserFollowing(req.params.alias);
  res.json({ following: rows });
}
