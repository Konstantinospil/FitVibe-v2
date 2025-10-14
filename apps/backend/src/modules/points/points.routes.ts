import { Router } from "express";
import db from "../../db/index.js";
import { authenticate } from "../../middlewares/auth.guard.js";

export const pointsRouter = Router();

pointsRouter.get("/", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const total = await db("sessions")
    .where({ owner_id: uid })
    .sum<{ total: string | number | null }>("points as total")
    .first();

  res.json({ total: Number(total?.total ?? 0) });
});

pointsRouter.get("/history", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const history = await db("sessions")
    .where({ owner_id: uid })
    .whereNotNull("completed_at")
    .select("id", "completed_at", "points")
    .orderBy("completed_at", "desc");

  res.json(history);
});

