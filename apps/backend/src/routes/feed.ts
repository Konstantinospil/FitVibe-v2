import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import db from "../db/index.js";

const r = Router();

r.get("/", authenticate, async (_req, res) => {
  const publicSessions = await db("sessions").where({ status: "completed" }).orderBy("completed_at","desc").limit(50);
  res.json(publicSessions);
});

r.post("/:id/clone", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const s = await db("sessions").where({ id: req.params.id }).first();
  if(!s) return res.status(404).json({message:"Not found"});
  const [clone] = await db("sessions").insert({ owner_id: uid, title: s.title, planned_for: s.planned_for, status: "planned" }).returning("*");
  res.status(201).json(clone);
});

export default r;
