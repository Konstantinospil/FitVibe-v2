import { Router } from "express";

import { requireAuth } from "../users/users.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getPointsHistoryHandler, getPointsSummaryHandler } from "./points.controller.js";

export const pointsRouter = Router();

pointsRouter.get("/", requireAuth, asyncHandler(getPointsSummaryHandler));
pointsRouter.get("/history", requireAuth, asyncHandler(getPointsHistoryHandler));
