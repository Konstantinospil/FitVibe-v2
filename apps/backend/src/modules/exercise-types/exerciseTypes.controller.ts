import type { Request, Response } from "express";
import { z } from "zod";

import { getAllTypes, getOneType, addType, editType, removeType } from "./exerciseTypes.service.js";

const createTypeSchema = z.object({
  code: z.string().min(2).max(30),
  name: z.string().min(3).max(100),
  description: z.string().max(255).optional(),
});

const updateTypeSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(255).optional(),
});

export async function listTypes(req: Request, res: Response) {
  const locale = (req.query.locale as string) || undefined;
  const types = await getAllTypes(locale);
  res.json(types);
}

export async function getType(req: Request, res: Response) {
  const { code } = req.params;
  const type = await getOneType(code);
  if (!type) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(type);
}

export async function createType(req: Request, res: Response) {
  const parsed = createTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const adminId = req.user?.sub;
  const type = await addType(parsed.data, adminId);
  res.status(201).json(type);
}

export async function updateType(req: Request, res: Response) {
  const { code } = req.params;
  const parsed = updateTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const adminId = req.user?.sub;
  const type = await editType(code, parsed.data, adminId);
  res.json(type);
}

export async function deleteType(req: Request, res: Response) {
  const { code } = req.params;
  const adminId = req.user?.sub;
  await removeType(code, adminId);
  res.status(204).send();
}
