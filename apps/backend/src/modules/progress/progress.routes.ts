import { Router } from 'express';
import { requireAuth } from '../users/users.middleware';
import { rateLimit } from '../common/rateLimiter';
import { exercisesHandler, plansHandler, summaryHandler, trendsHandler } from './progress.controller';

export const progressRouter = Router();

progressRouter.get('/summary', rateLimit('progress_summary', 60, 60), requireAuth, summaryHandler);
progressRouter.get('/trends', rateLimit('progress_trends', 60, 60), requireAuth, trendsHandler);
progressRouter.get('/exercises', rateLimit('progress_exercises', 60, 60), requireAuth, exercisesHandler);
progressRouter.get('/plans', rateLimit('progress_plans', 60, 60), requireAuth, plansHandler);
