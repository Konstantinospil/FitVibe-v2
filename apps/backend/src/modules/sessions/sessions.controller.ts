import { Request, Response } from 'express';
import { z } from 'zod';
import { getAll, getOne, createOne, updateOne, cancelOne } from './sessions.service';

const statusEnum = z.enum(['planned', 'in_progress', 'completed', 'canceled']);

const createSchema = z.object({
  plan_id: z.string().uuid().nullable().optional(),
  name: z.string().min(2).max(100),
  date: z.string().datetime(),
  notes: z.string().max(1000).nullable().optional()
});

const updateSchema = z.object({
  plan_id: z.string().uuid().nullable().optional(),
  name: z.string().min(2).max(100).optional(),
  date: z.string().datetime().optional(),
  status: statusEnum.optional(),
  notes: z.string().max(1000).nullable().optional()
});

const querySchema = z.object({
  status: statusEnum.optional(),
  plan_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).max(10000).default(0)
});

export async function listSessionsHandler(req: Request, res: Response) {
  const userId = req.user?.sub!;
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await getAll(userId, parsed.data);
  res.json(result);
}

export async function getSessionHandler(req: Request, res: Response) {
  const userId = req.user?.sub!;
  const { id } = req.params;
  const result = await getOne(userId, id);
  res.json(result);
}

export async function createSessionHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user?.sub!;
  const created = await createOne(userId, parsed.data);
  res.status(201).json(created);
}

export async function updateSessionHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user?.sub!;
  const { id } = req.params;
  const updated = await updateOne(userId, id, parsed.data);
  res.json(updated);
}

export async function deleteSessionHandler(req: Request, res: Response) {
  const userId = req.user?.sub!;
  const { id } = req.params;
  await cancelOne(userId, id);
  res.status(204).send();
}
