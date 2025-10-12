import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../users/users.middleware';
import { rateLimit } from '../common/rateLimiter';
import { uploadAvatarHandler, getAvatarHandler, deleteAvatarHandler } from './users.avatar.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const usersAvatarRouter = Router();

usersAvatarRouter.post(
  '/avatar',
  rateLimit('user_avatar_upload', 5, 60),
  requireAuth,
  upload.single('avatar'),
  uploadAvatarHandler
);

usersAvatarRouter.get(
  '/avatar/:id',
  rateLimit('user_avatar_get', 60, 60),
  getAvatarHandler
);

usersAvatarRouter.delete(
  '/avatar',
  rateLimit('user_avatar_delete', 10, 60),
  requireAuth,
  deleteAvatarHandler
);
