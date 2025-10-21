import NodeCache from "node-cache";
import { insertAudit } from "../common/audit.util.js";
import type {
  ExercisesPayload,
  PlanProgress,
  ProgressSummary,
  TrendGroupBy,
  TrendsPayload,
} from "./progress.types.js";
import {
  fetchExerciseBreakdown,
  fetchPlansProgress,
  fetchSummary,
  fetchTrends,
} from "./progress.repository";

const cache = new NodeCache({ stdTTL: 60 });

export async function getSummary(userId: string, period: number): Promise<ProgressSummary> {
  const key = `summary:${userId}:${period}`;
  const cached = cache.get<ProgressSummary>(key);
  if (cached) {
    return cached;
  }

  const res = await fetchSummary(userId, period);
  cache.set(key, res);
  await insertAudit({
    actorUserId: userId,
    entity: "progress",
    action: "summary",
    entityId: userId,
    metadata: { period },
  });
  return res;
}

export async function getTrends(
  userId: string,
  period: number,
  groupBy: TrendGroupBy,
): Promise<TrendsPayload> {
  const key = `trends:${userId}:${period}:${groupBy}`;
  const cached = cache.get<TrendsPayload>(key);
  if (cached) {
    return cached;
  }

  const data = await fetchTrends(userId, period, groupBy);
  const res = { period, group_by: groupBy, data };
  cache.set(key, res);
  await insertAudit({
    actorUserId: userId,
    entity: "progress",
    action: "trends",
    entityId: userId,
    metadata: { period, groupBy },
  });
  return res;
}

export async function getExerciseBreakdown(
  userId: string,
  period: number,
): Promise<ExercisesPayload> {
  const key = `ex_bd:${userId}:${period}`;
  const cached = cache.get<ExercisesPayload>(key);
  if (cached) {
    return cached;
  }

  const data = await fetchExerciseBreakdown(userId, period);
  const res = { period, data };
  cache.set(key, res);
  await insertAudit({
    actorUserId: userId,
    entity: "progress",
    action: "exercises_breakdown",
    entityId: userId,
    metadata: { period },
  });
  return res;
}

export async function getPlans(userId: string): Promise<PlanProgress[]> {
  const key = `plans:${userId}`;
  const cached = cache.get<PlanProgress[]>(key);
  if (cached) {
    return cached;
  }

  const data = await fetchPlansProgress(userId);
  cache.set(key, data);
  await insertAudit({
    actorUserId: userId,
    entity: "progress",
    action: "plans",
    entityId: userId,
  });
  return data;
}
