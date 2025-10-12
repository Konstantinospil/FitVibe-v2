import { Router } from 'express';
import { me, list, getById, updateMe, changePassword, deactivateAccount } from './users.controller.js';
import { requireAuth } from './users.middleware.js';
import { requireRole } from '../common/rbac.middleware.js';
import { rateLimit } from '../common/rateLimiter.js';
import { exportData } from './users.controller.js';
import { uploadAvatarHandler, getAvatarHandler, deleteAvatarHandler } from './users.avatar.controller.js';
import multer from 'multer';
import { usersAvatarRouter } from '../users/users.avatar.routes';

app.use('/api/users', usersAvatarRouter);

const upload = multer({ storage: multer.memoryStorage() });

usersRouter.post(
  '/avatar',
  requireAuth,
  rateLimit('user_avatar', 10, 60),
  upload.single('avatar'),
  uploadAvatarHandler
);

export const usersRouter = Router();

usersRouter.get('/me', rateLimit('user_me', 60, 60), requireAuth, me);
usersRouter.patch('/me', rateLimit('user_update', 20, 60), requireAuth, updateMe);
usersRouter.post('/change-password', rateLimit('user_pw', 10, 60), requireAuth, changePassword);
usersRouter.delete('/me', rateLimit('user_delete', 10, 60), requireAuth, deactivateAccount);
usersRouter.get('/', rateLimit('user_list', 10, 60), requireAuth, requireRole('admin'), list);
usersRouter.get('/me/export', requireAuth, rateLimit('user_export', 2, 3600), exportData);
usersRouter.get('/:id', requireAuth, requireRole('admin'), getById);
usersRouter.get('/avatar/:id', rateLimit('avatar_get', 60, 60), getAvatarHandler);
usersRouter.delete('/avatar', requireAuth, rateLimit('avatar_delete', 10, 60), deleteAvatarHandler);