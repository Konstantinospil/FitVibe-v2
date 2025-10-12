import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RSA_KEYS } from "../../config/env.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, RSA_KEYS.publicKey, { algorithms: ["RS256"] });
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
