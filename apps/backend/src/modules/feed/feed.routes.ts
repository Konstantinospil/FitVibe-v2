import { Router } from "express";

import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../users/users.middleware.js";
import { rateLimit } from "../common/rateLimiter.js";
import {
  blockUserHandler,
  bookmarkSessionHandler,
  cloneSessionFromFeedHandler,
  createCommentHandler,
  createShareLinkHandler,
  deleteCommentHandler,
  followUserHandler,
  getFeedHandler,
  getLeaderboardHandler,
  getSharedSessionHandler,
  likeFeedItemHandler,
  listBookmarksHandler,
  listCommentsHandler,
  listFollowersHandler,
  listFollowingHandler,
  removeBookmarkHandler,
  reportCommentHandler,
  reportFeedItemHandler,
  revokeShareLinkHandler,
  unlikeFeedItemHandler,
  unfollowUserHandler,
  unblockUserHandler,
} from "./feed.controller.js";

export const feedRouter = Router();

feedRouter.get("/", rateLimit("feed_public", 120, 60), asyncHandler(getFeedHandler));

feedRouter.get(
  "/leaderboard",
  rateLimit("feed_leaderboard", 60, 60),
  asyncHandler(getLeaderboardHandler),
);

feedRouter.get(
  "/link/:token",
  rateLimit("feed_link_view", 240, 60),
  asyncHandler(getSharedSessionHandler),
);

feedRouter.post(
  "/session/:sessionId/link",
  rateLimit("feed_link_create", 20, 60),
  requireAuth,
  asyncHandler(createShareLinkHandler),
);

feedRouter.delete(
  "/session/:sessionId/link",
  rateLimit("feed_link_revoke", 20, 60),
  requireAuth,
  asyncHandler(revokeShareLinkHandler),
);

feedRouter.post(
  "/session/:sessionId/clone",
  rateLimit("feed_clone", 20, 60),
  requireAuth,
  asyncHandler(cloneSessionFromFeedHandler),
);

feedRouter.post(
  "/session/:sessionId/bookmark",
  rateLimit("feed_bookmark", 100, 300),
  requireAuth,
  asyncHandler(bookmarkSessionHandler),
);

feedRouter.delete(
  "/session/:sessionId/bookmark",
  rateLimit("feed_bookmark", 100, 300),
  requireAuth,
  asyncHandler(removeBookmarkHandler),
);

feedRouter.get(
  "/bookmarks",
  rateLimit("feed_bookmark_list", 60, 60),
  requireAuth,
  asyncHandler(listBookmarksHandler),
);

feedRouter.post(
  "/item/:feedItemId/like",
  rateLimit("feed_like", 100, 300),
  requireAuth,
  asyncHandler(likeFeedItemHandler),
);

feedRouter.delete(
  "/item/:feedItemId/like",
  rateLimit("feed_like", 100, 300),
  requireAuth,
  asyncHandler(unlikeFeedItemHandler),
);

feedRouter.get(
  "/item/:feedItemId/comments",
  rateLimit("feed_comments_list", 120, 60),
  asyncHandler(listCommentsHandler),
);

feedRouter.post(
  "/item/:feedItemId/comments",
  rateLimit("feed_comments_create", 20, 3600),
  requireAuth,
  asyncHandler(createCommentHandler),
);

feedRouter.delete(
  "/comments/:commentId",
  rateLimit("feed_comments_delete", 60, 3600),
  requireAuth,
  asyncHandler(deleteCommentHandler),
);

feedRouter.post(
  "/item/:feedItemId/report",
  rateLimit("feed_report_item", 20, 3600),
  requireAuth,
  asyncHandler(reportFeedItemHandler),
);

feedRouter.post(
  "/comments/:commentId/report",
  rateLimit("feed_report_comment", 20, 3600),
  requireAuth,
  asyncHandler(reportCommentHandler),
);

feedRouter.post(
  "/users/:alias/block",
  rateLimit("feed_block_user", 50, 86400),
  requireAuth,
  asyncHandler(blockUserHandler),
);

feedRouter.delete(
  "/users/:alias/block",
  rateLimit("feed_block_user", 50, 86400),
  requireAuth,
  asyncHandler(unblockUserHandler),
);

feedRouter.post(
  "/users/:alias/follow",
  rateLimit("feed_follow_user", 50, 86400),
  requireAuth,
  asyncHandler(followUserHandler),
);

feedRouter.delete(
  "/users/:alias/follow",
  rateLimit("feed_follow_user", 50, 86400),
  requireAuth,
  asyncHandler(unfollowUserHandler),
);

feedRouter.get(
  "/users/:alias/followers",
  rateLimit("feed_followers_list", 120, 60),
  asyncHandler(listFollowersHandler),
);

feedRouter.get(
  "/users/:alias/following",
  rateLimit("feed_following_list", 120, 60),
  asyncHandler(listFollowingHandler),
);
