import NodeCache from 'node-cache';
import { insertAudit } from '../common/audit.util';
import { ExercisesPayload, ProgressSummary, TrendGroupBy, TrendsPayload } from './progress.types';
import { fetchExerciseBreakdown, fetchPlansProgress, fetchSummary, fetchTrends } from './progress.repository';

const cache = new NodeCache({ stdTTL: 60 });

export async function getSummary(userId: string, period: number): Promise<ProgressSummary> {
  const key = `summary:${userId}:${period}`;
  const cached = cache.get<ProgressSummary>(key);
  if (cached) return cached;

  const res = await fetchSummary(userId, period);
  cache.set(key, res);
  await insertAudit(userId, 'progress_summary', { period });
  return res;
}

export async function getTrends(userId: string, period: number, groupBy: TrendGroupBy): Promise<TrendsPayload> {
  const key = `trends:${userId}:${period}:${groupBy}`;
  const cached = cache.get<TrendsPayload>(key);
  if (cached) return cached;

  const data = await fetchTrends(userId, period, groupBy);
  const res = { period, group_by: groupBy, data };
  cache.set(key, res);
  await insertAudit(userId, 'progress_trends', { period, groupBy });
  return res;
}

export async function getExerciseBreakdown(userId: string, period: number): Promise<ExercisesPayload> {
  const key = `ex_bd:${userId}:${period}`;
  const cached = cache.get<ExercisesPayload>(key);
  if (cached) return cached;

  const data = await fetchExerciseBreakdown(userId, period);
  const res = { period, data };
  cache.set(key, res);
  await insertAudit(userId, 'progress_exercises', { period });
  return res;
}

export async function getPlans(userId: string) {
  const key = `plans:${userId}`;
  const cached = cache.get<any>(key);
  if (cached) return cached;

  const data = await fetchPlansProgress(userId);
  cache.set(key, data);
  await insertAudit(userId, 'progress_plans', {});
  return data;
}
