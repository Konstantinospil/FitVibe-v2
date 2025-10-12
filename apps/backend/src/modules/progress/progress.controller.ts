import { Request, Response } from 'express';
import { z } from 'zod';
import { getExerciseBreakdown, getPlans, getSummary, getTrends } from './progress.service';

const periodEnum = z.enum(['7','30','90']).transform(v => parseInt(v, 10));
const groupByEnum = z.enum(['day','week']);

export async function summaryHandler(req: Request, res: Response) {
  const parsed = z.object({ period: periodEnum.default('30') }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user?.sub!;
  const result = await getSummary(userId, parsed.data.period);
  res.json(result);
}

export async function trendsHandler(req: Request, res: Response) {
  const parsed = z.object({
    period: periodEnum.default('30'),
    group_by: groupByEnum.default('day')
  }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user?.sub!;
  const result = await getTrends(userId, parsed.data.period, parsed.data.group_by);
  res.json(result);
}

export async function exercisesHandler(req: Request, res: Response) {
  const parsed = z.object({ period: periodEnum.default('90') }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user?.sub!;
  const result = await getExerciseBreakdown(userId, parsed.data.period);
  res.json(result);
}

export async function plansHandler(req: Request, res: Response) {
  const userId = req.user?.sub!;
  const result = await getPlans(userId);
  res.json(result);
}
