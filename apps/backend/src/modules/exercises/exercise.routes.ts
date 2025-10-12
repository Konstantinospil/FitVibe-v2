import { Router } from 'express';
import { listExercisesHandler, getExerciseHandler, createExerciseHandler, updateExerciseHandler, deleteExerciseHandler } from './exercise.controller.js';
import { requireAuth } from '../users/users.middleware.js';
import { rateLimit } from '../common/rateLimiter.js';

export const exercisesRouter = Router();

exercisesRouter.get('/', rateLimit('ex_list', 60, 60), requireAuth, listExercisesHandler);
exercisesRouter.get('/:id', rateLimit('ex_get', 60, 60), requireAuth, getExerciseHandler);
exercisesRouter.post('/', rateLimit('ex_create', 20, 60), requireAuth, createExerciseHandler);
exercisesRouter.put('/:id', rateLimit('ex_update', 20, 60), requireAuth, updateExerciseHandler);
exercisesRouter.delete('/:id', rateLimit('ex_delete', 20, 60), requireAuth, deleteExerciseHandler);
