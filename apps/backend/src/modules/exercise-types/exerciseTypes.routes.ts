import { Router } from 'express';
import { listTypes, getType, createType, updateType, deleteType } from './exerciseTypes.controller.js';
import { requireAuth } from '../users/users.middleware.js';
import { requireRole } from '../common/rbac.middleware.js';
import { rateLimit } from '../common/rateLimiter.js';

export const exerciseTypesRouter = Router();

exerciseTypesRouter.get('/', rateLimit('types_list', 60, 60), listTypes);
exerciseTypesRouter.get('/:code', rateLimit('types_get', 60, 60), getType);

// Admin-only operations
exerciseTypesRouter.post('/', rateLimit('types_create', 10, 60), requireAuth, requireRole('admin'), createType);
exerciseTypesRouter.patch('/:code', rateLimit('types_update', 10, 60), requireAuth, requireRole('admin'), updateType);
exerciseTypesRouter.delete('/:code', rateLimit('types_delete', 10, 60), requireAuth, requireRole('admin'), deleteType);
