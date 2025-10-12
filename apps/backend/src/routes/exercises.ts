import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import db from "../db/index.js";
import { randomUUID } from "crypto";

const r = Router();

r.get("/", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const list = await db("exercises").where({ owner_id: uid }).whereNull("archived_at");
  res.json(list);
});

r.post("/", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const { name, category, tags=[] } = req.body || {};
  if(!name || !category) return res.status(400).json({message:"name and category required"});
  const [ex] = await db("exercises").insert({ id: randomUUID(), owner_id: uid, name, category, tags: JSON.stringify(tags) }).returning("*");
  res.status(201).json(ex);
});

r.put("/:id", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const [ex] = await db("exercises").where({ id: req.params.id, owner_id: uid }).update(req.body).returning("*");
  if(!ex) return res.status(404).json({message:"Not found"});
  res.json(ex);
});

r.delete("/:id", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const changed = await db("exercises").where({ id: req.params.id, owner_id: uid }).update({ archived_at: db.fn.now() });
  if(!changed) return res.status(404).send();
  res.status(204).send();
});

export default r;
