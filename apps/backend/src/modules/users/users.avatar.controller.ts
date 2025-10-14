import { Request, Response } from "express";
import sharp from "sharp";
import { insertAudit } from "../common/audit.util.js";
import { saveUserAvatarBase64, getUserAvatarBase64, clearUserAvatar } from "./users.avatar.repository.js";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/jpg"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function uploadAvatarHandler(req: Request, res: Response) {
  const userId = req.user?.sub as string;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  if (!ALLOWED_MIME.has(req.file.mimetype)) return res.status(400).json({ error: "Unsupported file type" });
  if (req.file.size > MAX_BYTES) return res.status(400).json({ error: "File too large (max 2MB)" });

  const png = await sharp(req.file.buffer)
    .rotate()
    .resize(256, 256, { fit: "cover" })
    .png({ quality: 80 })
    .toBuffer();

  const base64 = png.toString("base64");
  await saveUserAvatarBase64(userId, base64);
  await insertAudit(userId, "user_avatar_upload", { size: png.length });

  res.json({ success: true, preview: `data:image/png;base64,${base64}` });
}

export async function getAvatarHandler(req: Request, res: Response) {
  const { id } = req.params;
  const base64 = await getUserAvatarBase64(id);
  if (!base64) return res.status(404).send("Avatar not found");
  const buf = Buffer.from(base64, "base64");
  res.set("Content-Type", "image/png");
  res.set("Cache-Control", "private, max-age=60");
  res.send(buf);
}

export async function deleteAvatarHandler(req: Request, res: Response) {
  const userId = req.user?.sub as string;
  await clearUserAvatar(userId);
  await insertAudit(userId, "user_avatar_delete", {});
  res.status(204).send();
}
