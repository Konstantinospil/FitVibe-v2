import { Router } from "express";
import db from "../../db/index.js";
import { authenticate } from "../../middlewares/auth.guard.js";

export const feedRouter = Router();

feedRouter.get("/", authenticate, async (_req, res) => {
  const publicSessions = await db("sessions")
    .where({ status: "completed", visibility: "public" })
    .orderBy("completed_at", "desc")
    .limit(50);

  res.json(publicSessions);
});

feedRouter.post("/:id/clone", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const session = await db("sessions").where({ id: req.params.id }).first();

  if (!session) {
    return res.status(404).json({ message: "Not found" });
  }

  const [clone] = await db("sessions")
    .insert({
      owner_id: uid,
      title: session.title,
      planned_at: session.planned_at,
      status: "planned",
      visibility: "private",
    })
    .returning("*");

  res.status(201).json(clone);
});


