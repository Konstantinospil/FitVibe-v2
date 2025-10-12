import { Router } from 'express';

import { authRouter } from './auth/auth.routes.js';
import { usersRouter } from './users/users.routes.js';
import { exerciseTypesRouter } from './exercise-types/exerciseTypes.routes.js';
import { exercisesRouter } from './exercises/exercise.routes.js';
import { sessionsRouter } from './sessions/sessions.routes.js';
import { plansRouter } from './plans/plans.routes.js';
import { logsRouter } from './logs/logs.routes.js';
import { pointsRouter } from './points/points.routes.js';
import { progressRouter } from './progress/progress.routes.js';
import { feedRouter } from './feed/feed.routes.js';
import { healthRouter } from './system/health.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/exercise-types', exerciseTypesRouter);
apiRouter.use('/exercises', exercisesRouter);
apiRouter.use('/sessions', sessionsRouter);
apiRouter.use('/plans', plansRouter);
apiRouter.use('/logs', logsRouter);
apiRouter.use('/points', pointsRouter);
apiRouter.use('/progress', progressRouter);
apiRouter.use('/feed', feedRouter);
apiRouter.use('/health', healthRouter);

export default apiRouter;
