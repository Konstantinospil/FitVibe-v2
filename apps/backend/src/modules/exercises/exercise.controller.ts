import { Request, Response } from 'express';
import { z } from 'zod';
import { getAll, getOne, createOne, updateOne, archiveOne } from './exercise.service.js';

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type_code: z.string().trim().min(1).max(30),
  owner_user_id: z.string().uuid().nullable().optional(),
  default_metrics: z.object({
      unit: z.enum(['kg','lb','km','mi','sec','min']).optional(),
      measure: z.enum(['weight','reps','duration','distance','rpe']).optional(),
      targets: z
        .object({
          reps: z.number().int().min(0).optional(),
          weight: z.number().min(0).optional(),
          duration_sec: z.number().int().min(0).optional(),
          distance: z.number().min(0).optional(),
        }).partial().optional(),
    }).partial().optional(),
})

const querySchema = z.object({
  search: z.string().trim().max(100).optional(),
  type_code: z.string().trim().max(30).optional(),
  include_archived: z.union([z.literal('true'), z.literal('false')]).optional().transform(v => v === 'true').default('false'),
  owner_user_id: z.string().uuid().nullable().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
})

const updateSchema = createSchema.partial();

export async function listExercisesHandler(req: Request, res: Response) {
  const userId = req.user?.sub!;
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = await getAll(userId, parsed.data);
  res.json(data);
}

export async function getExerciseHandler(req: Request, res: Response) {
  const userId = req.user?.sub!;
  const { id } = req.params;
  const data = await getOne(id, userId);
  res.json(data);
};

export async function createExerciseHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user?.sub!;
  const isAdmin = req.user?.role === 'admin';
  const data = await createOne(userId, parsed.data, isAdmin);
  res.status(201).json(data);
}

export async function updateExerciseHandler(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user?.sub!;
  const isAdmin = req.user?.role === 'admin';
  const { id } = req.params;
  const data = await updateOne(id, userId, parsed.data, isAdmin);
  res.json(data);
}

export async function deleteExerciseHandler(req: Request, res: Response) {
  const userId = req.user?.sub!;
  const isAdmin = req.user?.role === 'admin';
  const { id } = req.params;
  await archiveOne(id, userId, isAdmin);
  res.status(204).send();
}
