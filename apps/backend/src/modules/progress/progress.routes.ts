import { Router } from "express";

import { requireAuth } from "../users/users.middleware.js";
import { rateLimit } from "../common/rateLimiter.js";
import {
  exercisesHandler,
  exportHandler,
  plansHandler,
  summaryHandler,
  trendsHandler,
} from "./progress.controller.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const progressRouter = Router();

progressRouter.get(
  "/summary",
  rateLimit("progress_summary", 60, 60),
  requireAuth,
  asyncHandler(summaryHandler),
);
progressRouter.get(
  "/trends",
  rateLimit("progress_trends", 60, 60),
  requireAuth,
  asyncHandler(trendsHandler),
);
progressRouter.get(
  "/exercises",
  rateLimit("progress_exercises", 60, 60),
  requireAuth,
  asyncHandler(exercisesHandler),
);
progressRouter.get(
  "/plans",
  rateLimit("progress_plans", 60, 60),
  requireAuth,
  asyncHandler(plansHandler),
);
progressRouter.get(
  "/export",
  rateLimit("progress_export", 15, 60),
  requireAuth,
  asyncHandler(exportHandler),
);
