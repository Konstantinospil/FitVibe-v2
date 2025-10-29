import NodeCache from "node-cache";
import { insertAudit } from "../common/audit.util.js";
import type {
  ExercisesPayload,
  PlanProgress,
  ProgressReport,
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

function escapeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function buildProgressReport(
  userId: string,
  period: number,
  groupBy: TrendGroupBy,
): Promise<ProgressReport> {
  const [summary, trends, exercises, plans] = await Promise.all([
    fetchSummary(userId, period),
    fetchTrends(userId, period, groupBy),
    fetchExerciseBreakdown(userId, period),
    fetchPlansProgress(userId),
  ]);

  const report: ProgressReport = {
    generated_at: new Date().toISOString(),
    period,
    group_by: groupBy,
    summary,
    trends,
    exercises,
    plans,
  };

  await insertAudit({
    actorUserId: userId,
    entity: "progress",
    action: "export_report",
    entityId: userId,
    metadata: { period, groupBy },
  });

  return report;
}

export function renderProgressReportCsv(report: ProgressReport): string {
  const lines: string[] = [];
  lines.push("section,metric,value");
  const summary = report.summary;
  lines.push(`summary,sessions_completed,${escapeCsvValue(summary.sessions_completed)}`);
  lines.push(`summary,total_reps,${escapeCsvValue(summary.total_reps)}`);
  lines.push(`summary,total_volume,${escapeCsvValue(summary.total_volume)}`);
  lines.push(`summary,total_duration_min,${escapeCsvValue(summary.total_duration_min)}`);
  lines.push(`summary,avg_volume_per_session,${escapeCsvValue(summary.avg_volume_per_session)}`);
  lines.push("");

  lines.push("trends,date,sessions,volume");
  for (const trend of report.trends) {
    lines.push(
      `trends,${escapeCsvValue(trend.date)},${escapeCsvValue(trend.sessions)},${escapeCsvValue(trend.volume)}`,
    );
  }
  lines.push("");

  lines.push("exercises,type_code,sessions,total_reps,total_volume,total_duration_min");
  for (const exercise of report.exercises) {
    lines.push(
      `exercises,${escapeCsvValue(exercise.type_code)},${escapeCsvValue(exercise.sessions)},${escapeCsvValue(exercise.total_reps)},${escapeCsvValue(exercise.total_volume)},${escapeCsvValue(exercise.total_duration_min)}`,
    );
  }
  lines.push("");

  lines.push("plans,id,name,progress_percent,session_count,completed_count");
  for (const plan of report.plans) {
    lines.push(
      `plans,${escapeCsvValue(plan.id)},${escapeCsvValue(plan.name)},${escapeCsvValue(plan.progress_percent)},${escapeCsvValue(plan.session_count)},${escapeCsvValue(plan.completed_count)}`,
    );
  }

  return lines.join("\n");
}
