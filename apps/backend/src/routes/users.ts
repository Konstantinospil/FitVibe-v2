import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import db from "../db/index.js";

const r = Router();

r.get("/me", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const user = await db("users").where({ id: uid }).first();
  const profile = await db("user_profiles").where({ user_id: uid }).first();
  if(!user) return res.status(404).json({message:"User not found"});
  res.json({ id: user.id, username: user.username, profile });
});

r.put("/me", authenticate, async (req, res) => {
  const uid = (req as any).user.sub;
  const allowed = ["display_name","sex","weight_kg","fitness_level","age"];
  const update: any = {};
  for(const k of allowed){ if(req.body?.[k]!==undefined) update[k]=req.body[k]; }
  await db("user_profiles").where({ user_id: uid }).update({ ...update, updated_at: db.fn.now() });
  const profile = await db("user_profiles").where({ user_id: uid }).first();
  res.json({ profile });
});

export default r;
