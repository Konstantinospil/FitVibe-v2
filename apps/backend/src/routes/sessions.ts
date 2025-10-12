import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import db from "../db/index.js";
import { estimateEntryCalories } from "../utils/calories.js";
import { toPoints } from "../utils/points.js";
import { randomUUID } from "crypto";

const r = Router();

r.get("/", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const list = await db("sessions").where({ owner_id: uid }).whereNull("archived_at");
  res.json(list);
});

r.post("/", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const { title, planned_for } = req.body || {};
  if(!title || !planned_for) return res.status(400).json({message:"title and planned_for required"});
  const [session] = await db("sessions").insert({ id: randomUUID(), owner_id: uid, title, planned_for }).returning("*");
  res.status(201).json(session);
});

r.patch("/:id/complete", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const s = await db("sessions").where({ id: req.params.id, owner_id: uid }).first();
  if(!s) return res.status(404).json({message:"Not found"});
  const profile = await db("user_profiles").where({ user_id: uid }).first();
  const calories = estimateEntryCalories(req.body?.actuals || {}, profile);
  const subjectiveDay = Number(req.body?.subjectiveDay || 5);
  const points = Math.round(toPoints({ calories, subjectiveDay }));
  const [updated] = await db("sessions").where({ id: s.id }).update({ status:"completed", completed_at: db.fn.now(), points }).returning("*");
  res.json({ ...updated, calories_estimate: calories });
});

export default r;
