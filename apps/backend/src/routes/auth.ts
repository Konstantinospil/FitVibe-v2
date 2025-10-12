import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import db from "../db/index.js";
import { cleanUsername, isStrongPassword } from "../utils/validators.js";
import { issueTokenPair, verifyRefresh } from "../services/tokens.js";
import { sha256 } from "../utils/hash.js";
import { env } from "../config/env.js";

const r = Router();

const registerSchema = z.object({
  username: z.string(),
  password: z.string(),
  sex: z.enum(["man","woman","diverse","na"]).optional(),
  weight_kg: z.number().optional(),
  fitness_level: z.string().optional(),
  age: z.number().optional()
});

r.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const uname = cleanUsername(data.username);
  if (!uname) return res.status(400).json({ error: "Invalid username" });
  if (!isStrongPassword(data.password)) return res.status(400).json({ error: "Weak password" });
  const exists = await db("users").where({ username: uname }).first();
  if (exists) return res.status(409).json({ error: "Username taken" });
  const hash = await bcrypt.hash(data.password, 12);
  const [user] = await db("users").insert({ username: uname, password_hash: hash, status: "active" }).returning("*");
  await db("user_profiles").insert({
    user_id: user.id,
    display_name: uname,
    sex: data.sex || "na",
    weight_kg: data.weight_kg || null,
    fitness_level: data.fitness_level || null,
    age: data.age || null
  });
  res.status(201).json({ id: user.id, username: user.username });
});

r.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  const uname = String(username||"").toLowerCase();
  const user = await db("users").where({ username: uname }).first();
  if(!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password||"", user.password_hash);
  if(!ok) return res.status(401).json({ error: "Invalid credentials" });
  const pair = issueTokenPair(user);
  const token_hash = sha256(pair.refresh);
  await db("auth_sessions").insert({
    user_id: user.id,
    jti: (JSON.parse(Buffer.from(pair.refresh.split('.')[1], 'base64').toString())?.jti) || 'n/a',
    token_hash,
    expires_at: db.raw(`now() + interval '${env.REFRESH_TOKEN_TTL}'`)
  });
  res.json({ access_token: pair.access, refresh_token: pair.refresh });
});

r.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body || {};
  if(!refresh_token) return res.status(400).json({ error: "No token provided" });
  try{
    const decoded: any = verifyRefresh(refresh_token);
    const stored = await db("auth_sessions").where({ user_id: decoded.sub, jti: decoded.jti, token_hash: sha256(refresh_token) }).first();
    if(!stored || stored.revoked_at) return res.status(401).json({ error: "Invalid session" });
    // rotate
    await db("auth_sessions").where({ id: stored.id }).update({ revoked_at: db.fn.now() });
    const [user] = await db("users").where({ id: decoded.sub }).returning("*");
    const pair = issueTokenPair(user);
    await db("auth_sessions").insert({
      user_id: user.id,
      jti: (JSON.parse(Buffer.from(pair.refresh.split('.')[1], 'base64').toString())?.jti) || 'n/a',
      token_hash: sha256(pair.refresh),
      expires_at: db.raw(`now() + interval '${env.REFRESH_TOKEN_TTL}'`)
    });
    return res.json({ access_token: pair.access, refresh_token: pair.refresh });
  }catch(e){
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

r.post("/logout", async (req, res) => {
  const { refresh_token } = req.body || {};
  if(refresh_token){
    await db("auth_sessions").where({ token_hash: sha256(refresh_token) }).update({ revoked_at: db.fn.now() });
  }
  res.status(204).send();
});

export default r;
