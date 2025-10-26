import { db } from "../../db/connection.js";

const FEED_ITEMS_TABLE = "feed_items";
const SESSIONS_TABLE = "sessions";
const USERS_TABLE = "users";
const FOLLOWERS_TABLE = "followers";
const SHARE_LINKS_TABLE = "share_links";
const FEED_LIKES_TABLE = "feed_likes";
const SESSION_BOOKMARKS_TABLE = "session_bookmarks";
const FEED_COMMENTS_TABLE = "feed_comments";
const USER_BLOCKS_TABLE = "user_blocks";
const FEED_REPORTS_TABLE = "feed_reports";
const LEADERBOARD_TABLE = "mv_leaderboard";

export type FeedScope = "public" | "me" | "following";

export interface FeedQueryOptions {
  viewerId?: string | null;
  scope: FeedScope;
  limit?: number;
  offset?: number;
}

export interface FeedItemWithSessionRow {
  feed_item_id: string;
  owner_id: string;
  owner_username: string;
  owner_display_name: string;
  visibility: string;
  published_at: string | null;
  session_id: string | null;
  session_title: string | null;
  session_completed_at: string | null;
  session_points: number | null;
}

export async function listFeedSessions({
  viewerId,
  scope,
  limit = 20,
  offset = 0,
}: FeedQueryOptions): Promise<FeedItemWithSessionRow[]> {
  const query = db(FEED_ITEMS_TABLE)
    .leftJoin(SESSIONS_TABLE, `${SESSIONS_TABLE}.id`, `${FEED_ITEMS_TABLE}.session_id`)
    .leftJoin(USERS_TABLE, `${USERS_TABLE}.id`, `${FEED_ITEMS_TABLE}.owner_id`)
    .select<FeedItemWithSessionRow[]>([
      `${FEED_ITEMS_TABLE}.id as feed_item_id`,
      `${FEED_ITEMS_TABLE}.owner_id`,
      `${USERS_TABLE}.username as owner_username`,
      `${USERS_TABLE}.display_name as owner_display_name`,
      `${FEED_ITEMS_TABLE}.visibility`,
      `${FEED_ITEMS_TABLE}.published_at`,
      `${SESSIONS_TABLE}.id as session_id`,
      `${SESSIONS_TABLE}.title as session_title`,
      `${SESSIONS_TABLE}.completed_at as session_completed_at`,
      `${SESSIONS_TABLE}.points as session_points`,
    ])
    .whereNull(`${FEED_ITEMS_TABLE}.deleted_at`)
    .orderBy(`${FEED_ITEMS_TABLE}.published_at`, "desc")
    .orderBy(`${FEED_ITEMS_TABLE}.created_at`, "desc")
    .limit(limit)
    .offset(offset);

  if (viewerId) {
    query.whereNotExists(
      db(USER_BLOCKS_TABLE)
        .select(1)
        .where(`${USER_BLOCKS_TABLE}.blocker_id`, viewerId)
        .whereRaw(`${USER_BLOCKS_TABLE}.blocked_id = ${FEED_ITEMS_TABLE}.owner_id`),
    );
    query.whereNotExists(
      db(USER_BLOCKS_TABLE)
        .select(1)
        .where(`${USER_BLOCKS_TABLE}.blocked_id`, viewerId)
        .whereRaw(`${USER_BLOCKS_TABLE}.blocker_id = ${FEED_ITEMS_TABLE}.owner_id`),
    );
  }

  if (scope === "public") {
    query.where(`${FEED_ITEMS_TABLE}.visibility`, "public");
  } else if (scope === "me") {
    if (!viewerId) {
      return [];
    }
    query.where(`${FEED_ITEMS_TABLE}.owner_id`, viewerId);
  } else if (scope === "following") {
    if (!viewerId) {
      return [];
    }
    query.whereIn(`${FEED_ITEMS_TABLE}.owner_id`, function selectFollowing(this: any) {
      this.select("following_id").from(FOLLOWERS_TABLE).where({ follower_id: viewerId });
    });
    query.where(`${FEED_ITEMS_TABLE}.visibility`, "public");
  }

  return query;
}

export interface SessionRow {
  id: string;
  owner_id: string;
  visibility: string;
  status: string;
  completed_at: string | null;
}

export async function findSessionById(sessionId: string): Promise<SessionRow | undefined> {
  return db<SessionRow>(SESSIONS_TABLE)
    .select(["id", "owner_id", "visibility", "status", "completed_at"])
    .where({ id: sessionId })
    .first();
}

export interface FeedItemRow {
  id: string;
  owner_id: string;
  session_id: string | null;
  visibility: string;
  published_at: string | null;
}

export async function findFeedItemBySessionId(
  sessionId: string,
): Promise<FeedItemRow | undefined> {
  return db<FeedItemRow>(FEED_ITEMS_TABLE)
    .select(["id", "owner_id", "session_id", "visibility", "published_at"])
    .where({ session_id: sessionId })
    .whereNull("deleted_at")
    .first();
}

export interface CreateFeedItemInput {
  ownerId: string;
  sessionId?: string | null;
  visibility: string;
  publishedAt?: Date | string | null;
}

export async function insertFeedItem({
  ownerId,
  sessionId = null,
  visibility,
  publishedAt,
}: CreateFeedItemInput): Promise<FeedItemRow> {
  const [row] = await db(FEED_ITEMS_TABLE)
    .insert({
      owner_id: ownerId,
      session_id: sessionId ?? null,
      kind: sessionId ? "session" : "generic",
      target_type: sessionId ? "session" : null,
      target_id: sessionId ?? null,
      visibility,
      published_at: publishedAt ?? db.fn.now(),
    })
    .returning<FeedItemRow[]>(["id", "owner_id", "session_id", "visibility", "published_at"]);
  return row;
}

export async function findFeedItemById(feedItemId: string): Promise<FeedItemRow | undefined> {
  return db<FeedItemRow>(FEED_ITEMS_TABLE)
    .select(["id", "owner_id", "session_id", "visibility", "published_at"])
    .where({ id: feedItemId })
    .whereNull("deleted_at")
    .first();
}

export async function updateFeedItem(
  feedItemId: string,
  patch: Partial<{ visibility: string; published_at: Date | string | null }>,
): Promise<void> {
  if (Object.keys(patch).length === 0) {
    return;
  }
  await db(FEED_ITEMS_TABLE)
    .where({ id: feedItemId })
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    });
}

export interface ShareLinkRow {
  id: string;
  session_id: string | null;
  feed_item_id: string | null;
  token: string;
  view_count: number;
  max_views: number | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  created_by: string;
}

export async function findActiveShareLinkBySession(
  sessionId: string,
): Promise<ShareLinkRow | undefined> {
  return db<ShareLinkRow>(SHARE_LINKS_TABLE)
    .where({ session_id: sessionId })
    .whereNull("revoked_at")
    .orderBy("created_at", "desc")
    .first();
}

export async function findShareLinkByToken(token: string): Promise<ShareLinkRow | undefined> {
  return db<ShareLinkRow>(SHARE_LINKS_TABLE).where({ token }).first();
}

export interface CreateShareLinkInput {
  sessionId: string | null;
  feedItemId: string | null;
  token: string;
  createdBy: string;
  maxViews?: number | null;
  expiresAt?: Date | null;
}

export async function insertShareLink({
  sessionId,
  feedItemId,
  token,
  createdBy,
  maxViews,
  expiresAt,
}: CreateShareLinkInput): Promise<ShareLinkRow> {
  const [row] = await db(SHARE_LINKS_TABLE)
    .insert({
      session_id: sessionId,
      feed_item_id: feedItemId,
      token,
      created_by: createdBy,
      max_views: maxViews ?? null,
      expires_at: expiresAt ?? null,
    })
    .returning<ShareLinkRow[]>("*");
  return row;
}

export async function incrementShareLinkView(linkId: string): Promise<void> {
  await db(SHARE_LINKS_TABLE)
    .where({ id: linkId })
    .increment("view_count", 1);
}

export async function revokeShareLinksForSession(sessionId: string): Promise<number> {
  return db(SHARE_LINKS_TABLE)
    .where({ session_id: sessionId })
    .whereNull("revoked_at")
    .update({ revoked_at: new Date().toISOString() });
}

export async function deleteFollower(
  followerId: string,
  followingId: string,
): Promise<number> {
  return db(FOLLOWERS_TABLE)
    .where({ follower_id: followerId, following_id: followingId })
    .del();
}

export async function upsertFollower(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const insertQuery = db(FOLLOWERS_TABLE)
    .insert({
      follower_id: followerId,
      following_id: followingId,
    })
    .onConflict(["follower_id", "following_id"])
    .ignore();

  const result = await insertQuery;
  if (Array.isArray(result)) {
    return result.length > 0;
  }
  if (typeof result === "number") {
    return result > 0;
  }
  return true;
}

export async function listFollowers(userId: string) {
  return db(FOLLOWERS_TABLE)
    .join(USERS_TABLE, `${USERS_TABLE}.id`, `${FOLLOWERS_TABLE}.follower_id`)
    .select([
      `${USERS_TABLE}.id as follower_id`,
      `${USERS_TABLE}.username as follower_username`,
      `${USERS_TABLE}.display_name as follower_display_name`,
      `${FOLLOWERS_TABLE}.created_at as followed_at`,
    ])
    .where({ [`${FOLLOWERS_TABLE}.following_id`]: userId })
    .orderBy(`${FOLLOWERS_TABLE}.created_at`, "desc");
}

export async function listFollowing(userId: string) {
  return db(FOLLOWERS_TABLE)
    .join(USERS_TABLE, `${USERS_TABLE}.id`, `${FOLLOWERS_TABLE}.following_id`)
    .select([
      `${USERS_TABLE}.id as following_id`,
      `${USERS_TABLE}.username as following_username`,
      `${USERS_TABLE}.display_name as following_display_name`,
      `${FOLLOWERS_TABLE}.created_at as followed_at`,
    ])
    .where({ [`${FOLLOWERS_TABLE}.follower_id`]: userId })
    .orderBy(`${FOLLOWERS_TABLE}.created_at`, "desc");
}

export async function upsertFeedLike(feedItemId: string, userId: string): Promise<boolean> {
  const insertQuery = db(FEED_LIKES_TABLE)
    .insert({
      feed_item_id: feedItemId,
      user_id: userId,
    })
    .onConflict(["feed_item_id", "user_id"])
    .ignore();
  const result = await insertQuery;
  if (Array.isArray(result)) {
    return result.length > 0;
  }
  if (typeof result === "number") {
    return result > 0;
  }
  return true;
}

export async function deleteFeedLike(feedItemId: string, userId: string): Promise<number> {
  return db(FEED_LIKES_TABLE).where({ feed_item_id: feedItemId, user_id: userId }).del();
}

export interface FeedItemStats {
  likes: number;
  comments: number;
}

export async function getFeedItemStats(
  feedItemIds: string[],
): Promise<Map<string, FeedItemStats>> {
  const map = new Map<string, FeedItemStats>();
  if (feedItemIds.length === 0) {
    return map;
  }
  for (const id of feedItemIds) {
    map.set(id, { likes: 0, comments: 0 });
  }
  const likeRows = await db(FEED_LIKES_TABLE)
    .whereIn("feed_item_id", feedItemIds)
    .groupBy("feed_item_id")
    .select<{ feed_item_id: string; count: string | number }[]>([
      "feed_item_id",
      db.raw("COUNT(*) as count"),
    ]);
  for (const row of likeRows) {
    const stats = map.get(row.feed_item_id);
    if (stats) {
      stats.likes = Number(row.count ?? 0);
    }
  }
  const commentRows = await db(FEED_COMMENTS_TABLE)
    .whereIn("feed_item_id", feedItemIds)
    .whereNull("deleted_at")
    .groupBy("feed_item_id")
    .select<{ feed_item_id: string; count: string | number }[]>([
      "feed_item_id",
      db.raw("COUNT(*) as count"),
    ]);
  for (const row of commentRows) {
    const stats = map.get(row.feed_item_id);
    if (stats) {
      stats.comments = Number(row.count ?? 0);
    }
  }
  return map;
}

export async function findUserLikedFeedItems(
  userId: string,
  feedItemIds: string[],
): Promise<Set<string>> {
  if (!userId || feedItemIds.length === 0) {
    return new Set();
  }
  const rows = await db(FEED_LIKES_TABLE)
    .where({ user_id: userId })
    .whereIn("feed_item_id", feedItemIds)
    .select<{ feed_item_id: string }[]>("feed_item_id");
  return new Set(rows.map((row) => row.feed_item_id));
}

export async function upsertBookmark(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const insertQuery = db(SESSION_BOOKMARKS_TABLE)
    .insert({
      session_id: sessionId,
      user_id: userId,
    })
    .onConflict(["session_id", "user_id"])
    .ignore();
  const result = await insertQuery;
  if (Array.isArray(result)) {
    return result.length > 0;
  }
  if (typeof result === "number") {
    return result > 0;
  }
  return true;
}

export async function deleteBookmark(sessionId: string, userId: string): Promise<number> {
  return db(SESSION_BOOKMARKS_TABLE).where({ session_id: sessionId, user_id: userId }).del();
}

export async function findUserBookmarkedSessions(
  userId: string,
  sessionIds: string[],
): Promise<Set<string>> {
  if (!userId || sessionIds.length === 0) {
    return new Set();
  }
  const rows = await db(SESSION_BOOKMARKS_TABLE)
    .where({ user_id: userId })
    .whereIn("session_id", sessionIds)
    .select<{ session_id: string }[]>("session_id");
  return new Set(rows.map((row) => row.session_id));
}

export interface BookmarkRow {
  session_id: string;
  feed_item_id: string | null;
  title: string | null;
  completed_at: string | null;
  visibility: string;
  owner_id: string;
  owner_username: string;
  owner_display_name: string;
  created_at: string;
  points: number | null;
}

export async function listBookmarkedSessions(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<BookmarkRow[]> {
  return db(SESSION_BOOKMARKS_TABLE)
    .join(SESSIONS_TABLE, `${SESSIONS_TABLE}.id`, `${SESSION_BOOKMARKS_TABLE}.session_id`)
    .leftJoin(
      FEED_ITEMS_TABLE,
      `${FEED_ITEMS_TABLE}.session_id`,
      `${SESSION_BOOKMARKS_TABLE}.session_id`,
    )
    .join(USERS_TABLE, `${USERS_TABLE}.id`, `${SESSIONS_TABLE}.owner_id`)
    .select<BookmarkRow[]>([
      `${SESSION_BOOKMARKS_TABLE}.session_id`,
      `${FEED_ITEMS_TABLE}.id as feed_item_id`,
      `${SESSIONS_TABLE}.title`,
      `${SESSIONS_TABLE}.completed_at`,
      `${SESSIONS_TABLE}.visibility`,
      `${SESSIONS_TABLE}.owner_id`,
      `${USERS_TABLE}.username as owner_username`,
      `${USERS_TABLE}.display_name as owner_display_name`,
      `${SESSION_BOOKMARKS_TABLE}.created_at`,
      `${SESSIONS_TABLE}.points`,
    ])
    .where({ [`${SESSION_BOOKMARKS_TABLE}.user_id`]: userId })
    .whereNull(`${FEED_ITEMS_TABLE}.deleted_at`)
    .whereNotExists(
      db(USER_BLOCKS_TABLE)
        .select(1)
        .where(`${USER_BLOCKS_TABLE}.blocker_id`, userId)
        .whereRaw(`${USER_BLOCKS_TABLE}.blocked_id = ${SESSIONS_TABLE}.owner_id`),
    )
    .whereNotExists(
      db(USER_BLOCKS_TABLE)
        .select(1)
        .where(`${USER_BLOCKS_TABLE}.blocked_id`, userId)
        .whereRaw(`${USER_BLOCKS_TABLE}.blocker_id = ${SESSIONS_TABLE}.owner_id`),
    )
    .orderBy(`${SESSION_BOOKMARKS_TABLE}.created_at`, "desc")
    .limit(limit)
    .offset(offset);
}

export interface CommentRow {
  id: string;
  feed_item_id: string;
  user_id: string;
  username: string;
  display_name: string;
  body: string;
  created_at: string;
  edited_at: string | null;
}

export async function listCommentsForFeedItem(
  feedItemId: string,
  limit = 50,
  offset = 0,
): Promise<CommentRow[]> {
  return db(FEED_COMMENTS_TABLE)
    .join(USERS_TABLE, `${USERS_TABLE}.id`, `${FEED_COMMENTS_TABLE}.user_id`)
    .select<CommentRow[]>([
      `${FEED_COMMENTS_TABLE}.id`,
      `${FEED_COMMENTS_TABLE}.feed_item_id`,
      `${FEED_COMMENTS_TABLE}.user_id`,
      `${USERS_TABLE}.username`,
      `${USERS_TABLE}.display_name`,
      `${FEED_COMMENTS_TABLE}.body`,
      `${FEED_COMMENTS_TABLE}.created_at`,
      `${FEED_COMMENTS_TABLE}.edited_at`,
    ])
    .where({ [`${FEED_COMMENTS_TABLE}.feed_item_id`]: feedItemId })
    .whereNull(`${FEED_COMMENTS_TABLE}.deleted_at`)
    .orderBy(`${FEED_COMMENTS_TABLE}.created_at`, "asc")
    .limit(limit)
    .offset(offset);
}

export interface InsertCommentInput {
  feedItemId: string;
  userId: string;
  body: string;
  parentId?: string | null;
}

export async function insertComment({
  feedItemId,
  userId,
  body,
  parentId = null,
}: InsertCommentInput) {
  const [row] = await db(FEED_COMMENTS_TABLE)
    .insert({
      feed_item_id: feedItemId,
      user_id: userId,
      parent_id: parentId,
      body,
    })
    .returning<CommentRow[]>([
      "id",
      "feed_item_id",
      "user_id",
      "body",
      "created_at",
      "edited_at",
    ]);
  return row;
}

export interface FeedCommentRecord {
  id: string;
  feed_item_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export async function findCommentById(
  commentId: string,
): Promise<FeedCommentRecord | undefined> {
  return db<FeedCommentRecord>(FEED_COMMENTS_TABLE)
    .select("*")
    .where({ id: commentId })
    .first();
}

export async function getCommentWithAuthor(commentId: string): Promise<CommentRow | undefined> {
  return db(FEED_COMMENTS_TABLE)
    .join(USERS_TABLE, `${USERS_TABLE}.id`, `${FEED_COMMENTS_TABLE}.user_id`)
    .select<CommentRow[]>([
      `${FEED_COMMENTS_TABLE}.id`,
      `${FEED_COMMENTS_TABLE}.feed_item_id`,
      `${FEED_COMMENTS_TABLE}.user_id`,
      `${USERS_TABLE}.username`,
      `${USERS_TABLE}.display_name`,
      `${FEED_COMMENTS_TABLE}.body`,
      `${FEED_COMMENTS_TABLE}.created_at`,
      `${FEED_COMMENTS_TABLE}.edited_at`,
    ])
    .where({ [`${FEED_COMMENTS_TABLE}.id`]: commentId })
    .whereNull(`${FEED_COMMENTS_TABLE}.deleted_at`)
    .first();
}

export async function softDeleteComment(commentId: string): Promise<number> {
  return db(FEED_COMMENTS_TABLE)
    .where({ id: commentId })
    .update({ deleted_at: new Date().toISOString() });
}

export async function hasBlockRelation(
  userA: string,
  userB: string,
): Promise<boolean> {
  const row = await db(USER_BLOCKS_TABLE)
    .whereIn("blocker_id", [userA, userB])
    .whereIn("blocked_id", [userA, userB])
    .first();
  return Boolean(row);
}

export async function insertBlock(blockerId: string, blockedId: string): Promise<boolean> {
  const insertQuery = db(USER_BLOCKS_TABLE)
    .insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    })
    .onConflict(["blocker_id", "blocked_id"])
    .ignore();
  const result = await insertQuery;
  if (Array.isArray(result)) {
    return result.length > 0;
  }
  if (typeof result === "number") {
    return result > 0;
  }
  return true;
}

export async function deleteBlock(blockerId: string, blockedId: string): Promise<number> {
  return db(USER_BLOCKS_TABLE)
    .where({ blocker_id: blockerId, blocked_id: blockedId })
    .del();
}

export interface FeedReportInsert {
  reporterId: string;
  feedItemId?: string | null;
  commentId?: string | null;
  reason: string;
  details?: string | null;
}

export async function insertFeedReport({
  reporterId,
  feedItemId = null,
  commentId = null,
  reason,
  details = null,
}: FeedReportInsert) {
  return db(FEED_REPORTS_TABLE).insert({
    reporter_id: reporterId,
    feed_item_id: feedItemId,
    comment_id: commentId,
    reason,
    details,
  });
}

export interface LeaderboardRow {
  user_id: string;
  username: string;
  display_name: string;
  points: number;
  badges_count: number;
}

export async function getLeaderboardRows({
  period,
  scope,
  viewerId,
  limit = 25,
}: {
  period: "week" | "month";
  scope: "global" | "friends";
  viewerId?: string;
  limit?: number;
}): Promise<LeaderboardRow[]> {
  const periodStartExpr = db.raw("date_trunc(?, now())::date", [period]);

  const query = db(LEADERBOARD_TABLE)
    .select<LeaderboardRow[]>([
      "user_id",
      "username",
      "display_name",
      "points",
      "badges_count",
    ])
    .where({ period_type: period })
    .andWhere("period_start", "=", periodStartExpr)
    .orderBy("points", "desc")
    .limit(limit);

  if (scope === "friends" && viewerId) {
    query.whereIn("user_id", function friendsScope(this: any) {
      this.select("following_id")
        .from(FOLLOWERS_TABLE)
        .where({ follower_id: viewerId });
      this.unionAll(function includeSelf(this: any) {
        this.select(db.raw("?", [viewerId]));
      });
    });
  }

  return query;
}
