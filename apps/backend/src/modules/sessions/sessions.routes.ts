import { Router } from "express";

import {
  listSessionsHandler,
  getSessionHandler,
  createSessionHandler,
  updateSessionHandler,
  deleteSessionHandler,
  cloneSessionHandler,
  applyRecurrenceHandler,
} from "./sessions.controller.js";
import { requireAuth } from "../users/users.middleware.js";
import { rateLimit } from "../common/rateLimiter.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const sessionsRouter = Router();

sessionsRouter.get(
  "/",
  rateLimit("sessions_list", 60, 60),
  requireAuth,
  asyncHandler(listSessionsHandler),
);
sessionsRouter.get(
  "/:id",
  rateLimit("sessions_get", 60, 60),
  requireAuth,
  asyncHandler(getSessionHandler),
);
sessionsRouter.post(
  "/",
  rateLimit("sessions_create", 20, 60),
  requireAuth,
  asyncHandler(createSessionHandler),
);
sessionsRouter.patch(
  "/:id",
  rateLimit("sessions_update", 30, 60),
  requireAuth,
  asyncHandler(updateSessionHandler),
);
sessionsRouter.post(
  "/:id/clone",
  rateLimit("sessions_clone", 20, 60),
  requireAuth,
  asyncHandler(cloneSessionHandler),
);
sessionsRouter.post(
  "/:id/recurrence",
  rateLimit("sessions_recurrence", 10, 60),
  requireAuth,
  asyncHandler(applyRecurrenceHandler),
);
sessionsRouter.delete(
  "/:id",
  rateLimit("sessions_delete", 20, 60),
  requireAuth,
  asyncHandler(deleteSessionHandler),
);
