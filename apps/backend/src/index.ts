import express, { Router } from "express";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";

import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { rateLimit } from "./middlewares/rateLimiter.js";
import { csrfProtection, csrfTokenRoute, validateOrigin } from "./middlewares/csrf.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { metricsMiddleware, metricsRoute } from "./observability/metrics.js";

import { authRouter } from "./modules/auth/auth.routes.js";
import { jwksHandler } from "./modules/auth/auth.controller.js";
import usersRouter from "./routes/users.js";
import exercisesRouter from "./routes/exercises.js";
import sessionsRouter from "./routes/sessions.js";
import progressRouter from "./routes/progress.js";
import pointsRouter from "./routes/points.js";
import feedRouter from "./routes/feed.js";
import healthRouter from "./routes/health.js";

const app = express();

app.set("trust proxy", 1);
app.get("/.well-known/jwks.json", jwksHandler);

app.use((req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number((process.hrtime.bigint() - started) / BigInt(1_000_000));
    logger.info(
      {
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs,
      },
      "request completed",
    );
  });

  next();
});

if (env.metricsEnabled) {
  app.use(metricsMiddleware);
  app.get("/metrics", metricsRoute);
}

const corsOrigins = env.allowedOrigins;
const corsOptions: CorsOptions = corsOrigins.length
  ? {
      origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        const error: Error & { status?: number; code?: string } = new Error("Origin not allowed by CORS");
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

const apiRouter = Router();

if (env.csrf.enabled) {
  apiRouter.get("/csrf-token", csrfTokenRoute);
}

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/exercises", exercisesRouter);
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("/progress", progressRouter);
apiRouter.use("/points", pointsRouter);
apiRouter.use("/feed", feedRouter);

const systemRouter = Router();
systemRouter.use("/health", healthRouter);
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

const port = env.PORT;
app.listen(port, () => {
  logger.info({ port }, "FitVibe Backend running");
});

export default app;

