import { Request, Response } from "express";
import archiver from "archiver";
import { z } from "zod";
import {
  getMe,
  listAll,
  updateProfile,
  updatePassword,
  deactivate,
  collectUserData,
  listContacts,
  updatePrimaryEmail,
  updatePhoneNumber,
  verifyContact,
  removeContact,
  changeStatus,
} from "./users.service.js";
import { passwordPolicy } from "../auth/auth.schemas.js";

const usernameSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, underscores, dots, or dashes");

const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  displayName: z.string().min(1).max(120).optional(),
  locale: z.string().max(10).optional(),
  preferredLang: z.string().max(5).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(12).max(128),
  newPassword: passwordPolicy,
});

const emailSchema = z.object({
  email: z.string().email().max(254),
});

const phoneSchema = z.object({
  phone: z.string().min(5).max(32),
  isRecovery: z.boolean().optional(),
});

const contactIdSchema = z.object({
  contactId: z.string().uuid(),
});

const statusSchema = z.object({
  status: z.enum(["pending_verification", "active", "archived", "pending_deletion"]),
});

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
  const profile = await deactivate(userId);
  return res.status(200).json(profile);
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

export async function listUserContacts(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const contacts = await listContacts(userId);
  return res.json(contacts);
}

export async function updateEmail(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const profile = await updatePrimaryEmail(userId, parsed.data.email);
  return res.json(profile);
}

export async function updatePhone(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = phoneSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const profile = await updatePhoneNumber(userId, parsed.data.phone, parsed.data.isRecovery ?? true);
  return res.json(profile);
}

export async function verifyContactHandler(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = contactIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const contact = await verifyContact(userId, parsed.data.contactId);
  return res.json(contact);
}

export async function removeContactHandler(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = contactIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  await removeContact(userId, parsed.data.contactId);
  return res.status(204).send();
}

export async function adminChangeStatus(req: Request, res: Response) {
  const actorId = req.user?.sub ?? null;
  const { id } = req.params;
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const profile = await changeStatus(actorId, id, parsed.data.status);
  return res.json(profile);
}
