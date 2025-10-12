import { Router } from 'express';
import {
  listSessionsHandler,
  getSessionHandler,
  createSessionHandler,
  updateSessionHandler,
  deleteSessionHandler
} from './sessions.controller';
import { requireAuth } from '../users/users.middleware';
import { rateLimit } from '../common/rateLimiter';

export const sessionsRouter = Router();

sessionsRouter.get('/', rateLimit('sessions_list', 60, 60), requireAuth, listSessionsHandler);
sessionsRouter.get('/:id', rateLimit('sessions_get', 60, 60), requireAuth, getSessionHandler);
sessionsRouter.post('/', rateLimit('sessions_create', 20, 60), requireAuth, createSessionHandler);
sessionsRouter.patch('/:id', rateLimit('sessions_update', 30, 60), requireAuth, updateSessionHandler);
sessionsRouter.delete('/:id', rateLimit('sessions_delete', 20, 60), requireAuth, deleteSessionHandler);
