import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import db from "../db/index.js";

const r = Router();

r.get("/summary", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const total = await db("sessions").where({ owner_id: uid }).count("* as c").first();
  const completed = await db("sessions").where({ owner_id: uid, status: "completed" }).count("* as c").first();
  res.json({ total: Number(total?.c||0), completed: Number(completed?.c||0) });
});

r.get("/charts", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const rows = await db("sessions").where({ owner_id: uid }).whereNotNull("completed_at").select("completed_at as x", "points as y").orderBy("completed_at");
  res.json({ series: rows });
});

export default r;
