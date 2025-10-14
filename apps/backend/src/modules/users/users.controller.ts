import { Request, Response } from "express";
import archiver from "archiver";
import sharp from "sharp";
import NodeCache from "node-cache";
import { z } from "zod";
import {
  getMe,
  listAll,
  updateProfile,
  updatePassword,
  deactivate,
  collectUserData,
} from "./users.service.js";
import { insertAudit } from "../common/audit.util.js";
import { passwordPolicy } from "../auth/auth.schemas.js";

const avatarCache = new NodeCache({ stdTTL: 300 });

const usernameSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, underscores, dots, or dashes");

const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  locale: z.string().max(10).optional(),
  bio: z.string().max(300).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(12).max(128),
  newPassword: passwordPolicy,
});

export async function uploadAvatarHandler(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const buffer = await sharp(req.file.buffer).resize(256, 256).png({ quality: 80 }).toBuffer();
  const base64 = buffer.toString("base64");
  avatarCache.set(userId, base64);

  await insertAudit(userId, "user_avatar_upload", { size: buffer.length });
  return res.json({ success: true, preview: `data:image/png;base64,${base64}` });
}

export async function getAvatarHandler(req: Request, res: Response) {
  const { id } = req.params;
  const base64 = avatarCache.get<string>(id);
  if (!base64) return res.status(404).send("Avatar not found");
  const img = Buffer.from(base64, "base64");
  res.set("Content-Type", "image/png");
  return res.send(img);
}

export async function me(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getMe(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(user);
}

export async function list(req: Request, res: Response) {
  const limit = Number.parseInt(req.query.limit as string, 10) || 50;
  const offset = Number.parseInt(req.query.offset as string, 10) || 0;
  const users = await listAll(limit, offset);
  return res.json(users);
}

export async function updateMe(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const user = await updateProfile(userId, parsed.data);
  return res.json(user);
}

export async function changePassword(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  await updatePassword(userId, parsed.data);
  return res.status(204).send();
}

export async function deactivateAccount(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  await deactivate(userId);
  return res.status(204).send();
}

export async function exportData(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const data = await collectUserData(userId);
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="fitvibe_user_export.zip"');

  const archive = archiver("zip");
  archive.pipe(res);
  archive.append(JSON.stringify(data, null, 2), { name: "user_data.json" });
  await archive.finalize();
}

export async function getById(req: Request, res: Response) {
  const { id } = req.params;
  const user = await getMe(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(user);
}
