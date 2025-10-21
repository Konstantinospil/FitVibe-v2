import { Router } from "express";

import db from "../../db/index.js";
import { authenticate } from "../../middlewares/auth.guard.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { Session } from "../sessions/sessions.types.js";

export const feedRouter = Router();

feedRouter.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const publicSessions = await db<Session>("sessions")
      .where({ status: "completed", visibility: "public" })
      .orderBy("completed_at", "desc")
      .limit(50);

    res.json(publicSessions);
  }),
);

feedRouter.post(
  "/:id/clone",
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

    const session = await db<Session>("sessions").where({ id: req.params.id }).first();

    if (!session) {
      return res.status(404).json({ message: "Not found" });
    }

    const [clone] = await db<Session>("sessions")
      .insert({
        owner_id: uid,
        title: session.title,
        planned_at: session.planned_at,
        status: "planned",
        visibility: "private",
      })
      .returning<Session[]>("*");

    res.status(201).json(clone);
  }),
);
