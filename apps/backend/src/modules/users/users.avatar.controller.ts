import { Request, Response } from "express";
import sharp from "sharp";
import { insertAudit } from "../common/audit.util.js";
import {
  saveUserAvatarMetadata,
  getUserAvatarMetadata,
  deleteUserAvatarMetadata,
} from "./users.avatar.repository.js";
import {
  deleteStorageObject,
  readStorageObject,
  saveUserAvatarFile,
} from "../../services/mediaStorage.service.js";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/jpg"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function uploadAvatarHandler(req: Request, res: Response) {
  const userId = req.user?.sub as string;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  if (!ALLOWED_MIME.has(req.file.mimetype)) return res.status(400).json({ error: "Unsupported file type" });
  if (req.file.size > MAX_BYTES) return res.status(400).json({ error: "File too large (max 2MB)" });

  const processed = await sharp(req.file.buffer)
    .rotate()
    .resize(256, 256, { fit: "cover" })
    .png({ quality: 80 })
    .toBuffer();

  const fileMeta = await saveUserAvatarFile(userId, processed, "image/png");
  const publicUrl = `/users/avatar/${userId}`;
  const { previousKey, record } = await saveUserAvatarMetadata(userId, {
    storageKey: fileMeta.storageKey,
    fileUrl: publicUrl,
    mimeType: "image/png",
    bytes: fileMeta.bytes,
  });

  if (previousKey) {
    await deleteStorageObject(previousKey).catch(() => undefined);
  }

  await insertAudit({
    actorUserId: userId,
    entity: "user_media",
    action: "avatar_upload",
    entityId: record.id,
    metadata: { size: fileMeta.bytes, mime: "image/png" },
  });

  res.json({
    success: true,
    fileUrl: publicUrl,
    bytes: fileMeta.bytes,
    preview: `data:image/png;base64,${processed.toString("base64")}`,
  });
}

export async function getAvatarHandler(req: Request, res: Response) {
  const { id } = req.params;
  const metadata = await getUserAvatarMetadata(id);
  if (!metadata) return res.status(404).send("Avatar not found");
  try {
    const buffer = await readStorageObject(metadata.storage_key);
    res.set("Content-Type", metadata.mime_type ?? "image/png");
    res.set("Cache-Control", "private, max-age=300");
    return res.send(buffer);
  } catch (error) {
    console.error("[avatar] read failed", error);
    return res.status(404).send("Avatar not found");
  }
}

export async function deleteAvatarHandler(req: Request, res: Response) {
  const userId = req.user?.sub as string;
  const metadata = await deleteUserAvatarMetadata(userId);
  if (metadata?.storage_key) {
    await deleteStorageObject(metadata.storage_key).catch(() => undefined);
  }
  await insertAudit({
    actorUserId: userId,
    entity: "user_media",
    action: "avatar_delete",
    entityId: metadata?.id ?? userId,
  });
  res.status(204).send();
}
