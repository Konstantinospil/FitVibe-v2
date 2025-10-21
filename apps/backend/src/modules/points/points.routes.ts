import { Router } from "express";

import db from "../../db/index.js";
import { authenticate } from "../../middlewares/auth.guard.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const pointsRouter = Router();

pointsRouter.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const uid = req.user?.sub;
    if (!uid) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Missing authenticated user context",
          requestId: res.locals.requestId,
        },
      });
    }
    const total = await db("sessions")
      .where({ owner_id: uid })
      .sum<{ total: string | number | null }>("points as total")
      .first();

    res.json({ total: Number(total?.total ?? 0) });
  }),
);

pointsRouter.get(
  "/history",
  authenticate,
  asyncHandler(async (req, res) => {
    const uid = req.user?.sub;
    if (!uid) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Missing authenticated user context",
          requestId: res.locals.requestId,
        },
      });
    }
    const history = await db("sessions")
      .where({ owner_id: uid })
      .whereNotNull("completed_at")
      .select("id", "completed_at", "points")
      .orderBy("completed_at", "desc");

    res.json(history);
  }),
);
