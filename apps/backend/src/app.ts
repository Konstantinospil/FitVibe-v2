import express, { Router } from "express";
import helmet from "helmet";
import type { CorsOptions } from "cors";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";

import { env } from "./config/env.js";
import { rateLimit } from "./middlewares/rate-limit.js";
import { csrfProtection, csrfTokenRoute, validateOrigin } from "./middlewares/csrf.js";
import { httpLogger } from "./middlewares/request-logger.js";
import { errorHandler } from "./middlewares/error.handler.js";
import { readOnlyGuard } from "./middlewares/read-only.guard.js";
import { metricsMiddleware, metricsRoute } from "./observability/metrics.js";
import { asyncHandler } from "./utils/async-handler.js";

import { authRouter } from "./api/auth.routes.js";
import { usersRouter } from "./api/users.routes.js";
import { exerciseTypesRouter } from "./api/exerciseTypes.routes.js";
import { exercisesRouter } from "./api/exercises.routes.js";
import { sessionsRouter } from "./api/sessions.routes.js";
import { progressRouter } from "./api/progress.routes.js";
import { pointsRouter } from "./api/points.routes.js";
import { feedRouter } from "./api/feed.routes.js";
import healthRouter from "./modules/health/health.router.js";
import systemRouter from "./modules/system/system.routes.js";
import { jwksHandler } from "./modules/auth/auth.controller.js";

const app = express();

app.set("trust proxy", 1);
app.get("/.well-known/jwks.json", jwksHandler);

app.use((req, res, next) => {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
});

app.use(httpLogger);

if (env.metricsEnabled) {
  app.use(metricsMiddleware);
  app.get("/metrics", asyncHandler(metricsRoute));
}

const corsOrigins = env.allowedOrigins;
const corsOptions: CorsOptions = corsOrigins.length
  ? {
      origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        const error: Error & { status?: number; code?: string } = new Error(
          "Origin not allowed by CORS",
        );
        error.status = 403;
        error.code = "FORBIDDEN";
        return callback(error);
      },
      credentials: true,
    }
  : { origin: true, credentials: true };

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit("global", env.globalRateLimit.points, env.globalRateLimit.duration));

if (env.csrf.enabled) {
  const origins = env.csrf.allowedOrigins.length ? env.csrf.allowedOrigins : corsOrigins;
  if (origins.length) {
    app.use(validateOrigin(origins));
  }
  app.use(csrfProtection);
}

// Apply read-only mode guard to protect against mutations during maintenance
app.use(readOnlyGuard);

const apiRouter = Router();

if (env.csrf.enabled) {
  apiRouter.get("/csrf-token", csrfTokenRoute);
}

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/exercise-types", exerciseTypesRouter);
apiRouter.use("/exercises", exercisesRouter);
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("/progress", progressRouter);
apiRouter.use("/points", pointsRouter);
apiRouter.use("/feed", feedRouter);

apiRouter.use("/system", systemRouter);

app.use("/api/v1", apiRouter);
app.use("/health", healthRouter);

app.use((_req, res, _next) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      requestId: res.locals.requestId,
    },
  });
});

app.use(errorHandler);

export const appInstance = app;

export default app;
