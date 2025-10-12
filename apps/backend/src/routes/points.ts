import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import db from "../db/index.js";

const r = Router();

r.get("/", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const rows = await db("sessions").where({ owner_id: uid }).sum("points as total").first();
  res.json({ total: Number(rows?.total || 0) });
});

r.get("/history", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const rows = await db("sessions").where({ owner_id: uid }).whereNotNull("completed_at").select("id","completed_at","points").orderBy("completed_at","desc");
  res.json(rows);
});

export default r;
