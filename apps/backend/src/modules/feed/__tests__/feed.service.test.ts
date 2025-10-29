import { HttpError } from "../../../utils/http.js";
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
} from "../feed.service.js";
import {
  deleteBookmark,
  deleteBlock,
  deleteFeedLike,
  deleteFollower,
  findActiveShareLinkBySession,
  findCommentById,
  findFeedItemById,
  findFeedItemBySessionId,
  findSessionById,
  findShareLinkByToken,
  findUserBookmarkedSessions,
  findUserLikedFeedItems,
  getCommentWithAuthor,
  getFeedItemStats,
  getLeaderboardRows,
  hasBlockRelation,
  incrementShareLinkView,
  insertBlock,
  insertComment,
  insertFeedItem,
  insertFeedReport,
  insertShareLink,
  listBookmarkedSessions,
  listCommentsForFeedItem,
  listFeedSessions,
  listFollowers,
  listFollowing,
  revokeShareLinksForSession,
  softDeleteComment,
  updateFeedItem,
  upsertBookmark,
  upsertFeedLike,
  upsertFollower,
} from "../feed.repository.js";
import { updateSession } from "../../sessions/sessions.repository.js";
import { cloneOne } from "../../sessions/sessions.service.js";
import { findUserByUsername } from "../../users/users.repository.js";
import { insertAudit } from "../../common/audit.util.js";

jest.mock("../feed.repository.js", () => ({
  listFeedSessions: jest.fn(),
  findSessionById: jest.fn(),
  findActiveShareLinkBySession: jest.fn(),
  findShareLinkByToken: jest.fn(),
  findFeedItemBySessionId: jest.fn(),
  findFeedItemById: jest.fn(),
  insertFeedItem: jest.fn(),
  insertShareLink: jest.fn(),
  incrementShareLinkView: jest.fn(),
  revokeShareLinksForSession: jest.fn(),
  updateFeedItem: jest.fn(),
  upsertFollower: jest.fn(),
  deleteFollower: jest.fn(),
  listFollowers: jest.fn(),
  listFollowing: jest.fn(),
  getFeedItemStats: jest.fn(),
  findUserLikedFeedItems: jest.fn(),
  findUserBookmarkedSessions: jest.fn(),
  upsertFeedLike: jest.fn(),
  deleteFeedLike: jest.fn(),
  upsertBookmark: jest.fn(),
  deleteBookmark: jest.fn(),
  listBookmarkedSessions: jest.fn(),
  listCommentsForFeedItem: jest.fn(),
  insertComment: jest.fn(),
  findCommentById: jest.fn(),
  getCommentWithAuthor: jest.fn(),
  softDeleteComment: jest.fn(),
  hasBlockRelation: jest.fn(),
  insertBlock: jest.fn(),
  deleteBlock: jest.fn(),
  insertFeedReport: jest.fn(),
  getLeaderboardRows: jest.fn(),
}));

jest.mock("../../sessions/sessions.repository.js", () => ({
  updateSession: jest.fn(),
}));

jest.mock("../../sessions/sessions.service.js", () => ({
  cloneOne: jest.fn(),
}));

jest.mock("../../users/users.repository.js", () => ({
  findUserByUsername: jest.fn(),
}));

jest.mock("../../common/audit.util.js", () => ({
  insertAudit: jest.fn(),
}));

const mockedListFeedSessions = listFeedSessions as jest.MockedFunction<typeof listFeedSessions>;
const mockedFindSessionById = findSessionById as jest.MockedFunction<typeof findSessionById>;
const mockedFindActiveShareLinkBySession = findActiveShareLinkBySession as jest.MockedFunction<
  typeof findActiveShareLinkBySession
>;
const mockedFindShareLinkByToken = findShareLinkByToken as jest.MockedFunction<
  typeof findShareLinkByToken
>;
const mockedFindFeedItemBySessionId = findFeedItemBySessionId as jest.MockedFunction<
  typeof findFeedItemBySessionId
>;
const mockedFindFeedItemById = findFeedItemById as jest.MockedFunction<typeof findFeedItemById>;
const mockedInsertFeedItem = insertFeedItem as jest.MockedFunction<typeof insertFeedItem>;
const mockedInsertShareLink = insertShareLink as jest.MockedFunction<typeof insertShareLink>;
const mockedIncrementShareLinkView = incrementShareLinkView as jest.MockedFunction<
  typeof incrementShareLinkView
>;
const mockedRevokeShareLinksForSession = revokeShareLinksForSession as jest.MockedFunction<
  typeof revokeShareLinksForSession
>;
const mockedUpdateFeedItem = updateFeedItem as jest.MockedFunction<typeof updateFeedItem>;
const mockedUpdateSession = updateSession as jest.MockedFunction<typeof updateSession>;
const mockedCloneOne = cloneOne as jest.MockedFunction<typeof cloneOne>;
const mockedFindUserByUsername = findUserByUsername as jest.MockedFunction<
  typeof findUserByUsername
>;
const mockedUpsertFollower = upsertFollower as jest.MockedFunction<typeof upsertFollower>;
const mockedDeleteFollower = deleteFollower as jest.MockedFunction<typeof deleteFollower>;
const mockedListFollowers = listFollowers as jest.MockedFunction<typeof listFollowers>;
const mockedListFollowing = listFollowing as jest.MockedFunction<typeof listFollowing>;
const mockedInsertAudit = insertAudit as jest.MockedFunction<typeof insertAudit>;
const mockedGetFeedItemStats = getFeedItemStats as jest.MockedFunction<typeof getFeedItemStats>;
const mockedFindUserLikedFeedItems = findUserLikedFeedItems as jest.MockedFunction<
  typeof findUserLikedFeedItems
>;
const mockedFindUserBookmarkedSessions = findUserBookmarkedSessions as jest.MockedFunction<
  typeof findUserBookmarkedSessions
>;
const mockedUpsertFeedLike = upsertFeedLike as jest.MockedFunction<typeof upsertFeedLike>;
const mockedDeleteFeedLike = deleteFeedLike as jest.MockedFunction<typeof deleteFeedLike>;
const mockedUpsertBookmark = upsertBookmark as jest.MockedFunction<typeof upsertBookmark>;
const mockedDeleteBookmark = deleteBookmark as jest.MockedFunction<typeof deleteBookmark>;
const mockedListBookmarkedSessions = listBookmarkedSessions as jest.MockedFunction<
  typeof listBookmarkedSessions
>;
const mockedListCommentsForFeedItem = listCommentsForFeedItem as jest.MockedFunction<
  typeof listCommentsForFeedItem
>;
const mockedInsertComment = insertComment as jest.MockedFunction<typeof insertComment>;
const mockedFindCommentById = findCommentById as jest.MockedFunction<typeof findCommentById>;
const mockedGetCommentWithAuthor = getCommentWithAuthor as jest.MockedFunction<
  typeof getCommentWithAuthor
>;
const mockedSoftDeleteComment = softDeleteComment as jest.MockedFunction<typeof softDeleteComment>;
const mockedHasBlockRelation = hasBlockRelation as jest.MockedFunction<typeof hasBlockRelation>;
const mockedInsertBlock = insertBlock as jest.MockedFunction<typeof insertBlock>;
const mockedDeleteBlock = deleteBlock as jest.MockedFunction<typeof deleteBlock>;
const mockedInsertFeedReport = insertFeedReport as jest.MockedFunction<typeof insertFeedReport>;
const mockedGetLeaderboardRows = getLeaderboardRows as jest.MockedFunction<
  typeof getLeaderboardRows
>;

describe("feed.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetFeedItemStats.mockResolvedValue(new Map());
    mockedFindUserLikedFeedItems.mockResolvedValue(new Set());
    mockedFindUserBookmarkedSessions.mockResolvedValue(new Set());
    mockedHasBlockRelation.mockResolvedValue(false);
    mockedListBookmarkedSessions.mockResolvedValue([] as any);
    mockedListCommentsForFeedItem.mockResolvedValue([] as any);
    mockedGetCommentWithAuthor.mockResolvedValue(null as any);
    mockedGetLeaderboardRows.mockResolvedValue([] as any);
  });

  it("returns feed items for public scope", async () => {
    mockedListFeedSessions.mockResolvedValueOnce([
      {
        feed_item_id: "feed-1",
        owner_id: "user-1",
        owner_username: "alice",
        owner_display_name: "Alice",
        visibility: "public",
        published_at: "2025-10-20T11:00:00Z",
        session_id: "session-1",
        session_title: "Session",
        session_completed_at: "2025-10-20T11:00:00Z",
        session_points: 120,
      },
    ] as any);
    mockedGetFeedItemStats.mockResolvedValueOnce(new Map([["feed-1", { likes: 2, comments: 1 }]]));
    mockedFindUserLikedFeedItems.mockResolvedValueOnce(new Set(["feed-1"]));
    mockedFindUserBookmarkedSessions.mockResolvedValueOnce(new Set(["session-1"]));

    const result = await getFeed({ scope: "public", limit: 10, offset: 0 });
    expect(mockedListFeedSessions).toHaveBeenCalledWith({
      viewerId: undefined,
      scope: "public",
      limit: 10,
      offset: 0,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      feedItemId: "feed-1",
      session: expect.objectContaining({ id: "session-1" }),
      stats: {
        likes: 2,
        comments: 1,
        viewerHasLiked: true,
        viewerHasBookmarked: true,
      },
    });
  });

  it("creates a share link and ensures feed item exists", async () => {
    mockedFindSessionById.mockResolvedValueOnce({
      id: "session-1",
      owner_id: "user-1",
      visibility: "private",
      status: "completed",
      completed_at: "2025-10-20T11:00:00Z",
    });
    mockedFindFeedItemBySessionId.mockResolvedValueOnce(undefined);
    mockedInsertFeedItem.mockResolvedValueOnce({
      id: "feed-1",
      owner_id: "user-1",
      session_id: "session-1",
      visibility: "link",
      published_at: "2025-10-20T11:00:00Z",
    });
    mockedFindActiveShareLinkBySession.mockResolvedValueOnce(undefined);
    mockedInsertShareLink.mockResolvedValueOnce({
      id: "share-1",
      session_id: "session-1",
      feed_item_id: "feed-1",
      token: "token",
      view_count: 0,
      max_views: null,
      expires_at: null,
      revoked_at: null,
      created_at: "2025-10-20T11:30:00Z",
      created_by: "user-1",
    });

    const link = await createShareLink("user-1", "session-1");
    expect(link.token).toBe("token");
    expect(mockedFindFeedItemBySessionId).toHaveBeenCalledWith("session-1");
    expect(mockedInsertFeedItem).toHaveBeenCalled();
    expect(mockedUpdateFeedItem).toHaveBeenCalledWith("feed-1", {
      visibility: "link",
      published_at: "2025-10-20T11:00:00Z",
    });
    expect(mockedUpdateSession).toHaveBeenCalledWith("session-1", "user-1", {
      visibility: "link",
    });
  });

  it("returns existing share link when already active", async () => {
    mockedFindSessionById.mockResolvedValue({
      id: "session-1",
      owner_id: "user-1",
      visibility: "link",
      status: "completed",
      completed_at: "2025-10-20T11:00:00Z",
    });
    mockedFindFeedItemBySessionId.mockResolvedValue({
      id: "feed-1",
      owner_id: "user-1",
      session_id: "session-1",
      visibility: "link",
      published_at: "2025-10-20T11:00:00Z",
    });
    mockedFindActiveShareLinkBySession.mockResolvedValueOnce({
      id: "share-1",
      session_id: "session-1",
      feed_item_id: "feed-1",
      token: "existing",
      view_count: 0,
      max_views: null,
      expires_at: null,
      revoked_at: null,
      created_at: "2025-10-20T11:30:00Z",
      created_by: "user-1",
    });

    const link = await createShareLink("user-1", "session-1");
    expect(link.token).toBe("existing");
    expect(mockedInsertShareLink).not.toHaveBeenCalled();
  });

  it("throws if non-owner attempts to share", async () => {
    mockedFindSessionById.mockResolvedValueOnce({
      id: "session-1",
      owner_id: "user-2",
      visibility: "private",
      status: "completed",
      completed_at: "2025-10-20T11:00:00Z",
    });
    await expect(createShareLink("user-1", "session-1")).rejects.toThrow(HttpError);
  });

  it("retrieves shared session via token", async () => {
    mockedFindShareLinkByToken.mockResolvedValueOnce({
      id: "share-1",
      session_id: null,
      feed_item_id: "feed-1",
      token: "token",
      view_count: 1,
      max_views: 5,
      expires_at: null,
      revoked_at: null,
      created_at: "2025-10-20T11:30:00Z",
      created_by: "user-1",
    });
    mockedFindFeedItemById.mockResolvedValueOnce({
      id: "feed-1",
      owner_id: "user-1",
      session_id: "session-1",
      visibility: "link",
      published_at: "2025-10-20T11:00:00Z",
    });
    mockedFindSessionById.mockResolvedValueOnce({
      id: "session-1",
      owner_id: "user-1",
      visibility: "link",
      status: "completed",
      completed_at: "2025-10-20T11:00:00Z",
    });

    const result = await getSharedSession("token");
    expect(result.session?.id).toBe("session-1");
    expect(result.feedItem?.id).toBe("feed-1");
    expect(mockedIncrementShareLinkView).toHaveBeenCalledWith("share-1");
  });

  it("revokes share links and resets visibility", async () => {
    mockedFindSessionById.mockResolvedValueOnce({
      id: "session-1",
      owner_id: "user-1",
      visibility: "link",
      status: "completed",
      completed_at: "2025-10-20T11:00:00Z",
    });
    mockedFindFeedItemBySessionId.mockResolvedValueOnce({
      id: "feed-1",
      owner_id: "user-1",
      session_id: "session-1",
      visibility: "link",
      published_at: "2025-10-20T11:00:00Z",
    });
    mockedRevokeShareLinksForSession.mockResolvedValueOnce(1);

    const count = await revokeShareLink("user-1", "session-1");
    expect(count).toBe(1);
    expect(mockedUpdateSession).toHaveBeenCalledWith("session-1", "user-1", {
      visibility: "private",
    });
    expect(mockedUpdateFeedItem).toHaveBeenCalledWith("feed-1", { visibility: "private" });
    expect(mockedInsertAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "share_link.revoke" }),
    );
  });

  it("clones a session via feed helper", async () => {
    mockedCloneOne.mockResolvedValueOnce({ id: "new-session" } as any);
    const cloned = await cloneSessionFromFeed("user-1", "session-1", { title: "Copy" });
    expect(mockedCloneOne).toHaveBeenCalledWith("user-1", "session-1", { title: "Copy" });
    expect(cloned).toEqual({ id: "new-session" });
  });

  it("follows and unfollows user by alias", async () => {
    mockedFindUserByUsername.mockResolvedValue({ id: "target-user" } as any);
    mockedUpsertFollower.mockResolvedValue(true);
    await followUserByAlias("actor", "alice");
    expect(mockedUpsertFollower).toHaveBeenCalledWith("actor", "target-user");

    mockedFindUserByUsername.mockResolvedValue({ id: "target-user" } as any);
    mockedDeleteFollower.mockResolvedValue(1);
    await unfollowUserByAlias("actor", "alice");
    expect(mockedDeleteFollower).toHaveBeenCalledWith("actor", "target-user");
  });

  it("lists followers and following", async () => {
    mockedFindUserByUsername
      .mockResolvedValueOnce({ id: "user-1" } as any)
      .mockResolvedValueOnce({ id: "user-1" } as any);
    mockedListFollowers.mockResolvedValueOnce([
      {
        follower_id: "friend",
        follower_username: "friend",
        follower_display_name: "Friend",
        followed_at: "2025-10-22T11:00:00Z",
      },
    ] as any);
    mockedListFollowing.mockResolvedValueOnce([
      {
        following_id: "coach",
        following_username: "coach",
        following_display_name: "Coach",
        followed_at: "2025-10-22T11:00:00Z",
      },
    ] as any);

    const followers = await listUserFollowers("alice");
    expect(followers[0]).toEqual({
      id: "friend",
      username: "friend",
      displayName: "Friend",
      followedAt: "2025-10-22T11:00:00Z",
    });

    const following = await listUserFollowing("alice");
    expect(following[0]).toEqual({
      id: "coach",
      username: "coach",
      displayName: "Coach",
      followedAt: "2025-10-22T11:00:00Z",
    });
  });

  it("likes feed item and returns updated stats", async () => {
    mockedFindFeedItemById.mockResolvedValueOnce({
      id: "feed-1",
      owner_id: "owner-1",
      session_id: "session-1",
      visibility: "public",
      published_at: "2025-10-20T11:00:00Z",
    } as any);
    mockedUpsertFeedLike.mockResolvedValueOnce(true);
    mockedGetFeedItemStats.mockResolvedValueOnce(new Map([["feed-1", { likes: 3, comments: 1 }]]));

    const result = await likeFeedItem("user-2", "feed-1");
    expect(mockedUpsertFeedLike).toHaveBeenCalledWith("feed-1", "user-2");
    expect(result.stats.likes).toBe(3);
  });

  it("bookmarks session for viewer", async () => {
    mockedFindSessionById.mockResolvedValueOnce({
      id: "session-1",
      owner_id: "owner-1",
      visibility: "public",
      status: "completed",
      completed_at: "2025-10-20T11:00:00Z",
    } as any);
    mockedUpsertBookmark.mockResolvedValueOnce(true);

    const result = await bookmarkSession("user-2", "session-1");
    expect(result.bookmarked).toBe(true);
  });

  it("lists bookmarks with owner metadata", async () => {
    mockedListBookmarkedSessions.mockResolvedValueOnce([
      {
        session_id: "session-1",
        feed_item_id: "feed-1",
        title: "Session",
        completed_at: "2025-10-20T11:00:00Z",
        visibility: "public",
        owner_id: "owner-1",
        owner_username: "alice",
        owner_display_name: "Alice",
        created_at: "2025-10-22T10:00:00Z",
        points: 120,
      },
    ] as any);

    const bookmarks = await listBookmarks("user-2", { limit: 10, offset: 0 });
    expect(bookmarks[0]).toMatchObject({
      sessionId: "session-1",
      owner: { username: "alice", displayName: "Alice" },
      points: 120,
    });
  });

  it("creates and deletes comments", async () => {
    mockedFindFeedItemById.mockResolvedValueOnce({
      id: "feed-1",
      owner_id: "owner-1",
      session_id: "session-1",
      visibility: "public",
      published_at: "2025-10-20T11:00:00Z",
    } as any);
    mockedInsertComment.mockResolvedValueOnce({
      id: "comment-1",
      feed_item_id: "feed-1",
      user_id: "user-2",
      body: "Nice",
      created_at: "2025-10-22T12:00:00Z",
      edited_at: null,
    } as any);
    mockedGetCommentWithAuthor.mockResolvedValueOnce({
      id: "comment-1",
      feed_item_id: "feed-1",
      user_id: "user-2",
      username: "user2",
      display_name: "User Two",
      body: "Nice",
      created_at: "2025-10-22T12:00:00Z",
      edited_at: null,
    } as any);

    const comment = await createComment("user-2", "feed-1", "Nice");
    expect(comment.id).toBe("comment-1");

    mockedFindCommentById.mockResolvedValueOnce({
      id: "comment-1",
      feed_item_id: "feed-1",
      user_id: "user-2",
      parent_id: null,
      body: "Nice",
      created_at: "",
      edited_at: null,
      deleted_at: null,
    } as any);
    mockedFindFeedItemById.mockResolvedValueOnce({
      id: "feed-1",
      owner_id: "user-2",
      session_id: "session-1",
      visibility: "public",
      published_at: "",
    } as any);
    mockedSoftDeleteComment.mockResolvedValueOnce(1 as any);

    const deletion = await deleteComment("user-2", "comment-1");
    expect(deletion.deleted).toBe(true);
  });

  it("blocks and reports feed items", async () => {
    mockedFindUserByUsername
      .mockResolvedValueOnce({ id: "target-1" } as any)
      .mockResolvedValueOnce({ id: "owner-1" } as any);
    mockedInsertBlock.mockResolvedValueOnce(true);
    mockedFindFeedItemById.mockResolvedValueOnce({
      id: "feed-1",
      owner_id: "owner-1",
      session_id: "session-1",
      visibility: "public",
      published_at: "",
    } as any);
    mockedInsertFeedReport.mockResolvedValueOnce([1] as any);

    const block = await blockUserByAlias("actor-1", "someone");
    expect(block.blockedId).toBe("target-1");

    const report = await reportFeedItem("actor-1", "feed-1", "Spam", "Details");
    expect(report.reported).toBe(true);
  });

  it("returns leaderboard stats", async () => {
    mockedGetLeaderboardRows.mockResolvedValueOnce([
      {
        user_id: "user-1",
        username: "alice",
        display_name: "Alice",
        points: "42",
        badges_count: "3",
      },
    ] as any);

    const leaderboard = await getLeaderboard("viewer-1", { scope: "global", period: "week" });
    expect(leaderboard[0]).toMatchObject({ points: 42, badges: 3 });
  });
});
