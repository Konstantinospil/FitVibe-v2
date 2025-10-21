import { Router } from "express";
import multer from "multer";
import { requireAuth } from "./users.middleware.js";
import { rateLimit } from "../common/rateLimiter.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  uploadAvatarHandler,
  getAvatarHandler,
  deleteAvatarHandler,
} from "./users.avatar.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const usersAvatarRouter = Router();

usersAvatarRouter.post(
  "/avatar",
  rateLimit("user_avatar_upload", 5, 60),
  requireAuth,
  upload.single("avatar"),
  asyncHandler(uploadAvatarHandler),
);

usersAvatarRouter.get(
  "/avatar/:id",
  rateLimit("user_avatar_get", 60, 60),
  asyncHandler(getAvatarHandler),
);

usersAvatarRouter.delete(
  "/avatar",
  rateLimit("user_avatar_delete", 10, 60),
  requireAuth,
  asyncHandler(deleteAvatarHandler),
);
