import { db } from "../../db/connection.js";
import type {
  ExerciseBreakdown,
  PlanProgress,
  ProgressSummary,
  TrendGroupBy,
  TrendPoint,
} from "./progress.types.js";

type TrendRow = {
  bucket_start: Date | string;
  sessions: number | string;
  volume: number | string;
};

type ExerciseAggregateRow = {
  type_code: string;
  sessions: number | string;
  total_reps: number | string;
  total_volume: number | string;
  total_duration_sec: number | string;
};

type PlanProgressRow = {
  id: string;
  name: string;
  progress_percent: number | string | null;
  session_count: number | string | null;
  completed_count: number | string | null;
  status: string;
  user_id: string;
  start_date: string | Date | null;
};

type SessionCountRow = {
  count: string;
};

type SummaryRow = {
  total_reps: number | string | null;
  total_volume: number | string | null;
  total_duration_sec: number | string | null;
};

function cutoffISO(periodDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - periodDays);
  return d.toISOString();
}

export async function fetchSummary(userId: string, period: number): Promise<ProgressSummary> {
  const cutoff = cutoffISO(period);

  const sessionsRow = await db("sessions as sess")
    .count<{ count: string }>("* as count")
    .where({ "sess.owner_id": userId, "sess.status": "completed" })
    .whereNotNull("sess.completed_at")
    .andWhere("sess.completed_at", ">=", cutoff)
    .first<SessionCountRow>();

  const sessions_completed = parseInt(sessionsRow?.count ?? "0", 10);

  const sums = await db("exercise_sets as s")
    .join("session_exercises as se", "se.id", "s.session_exercise_id")
    .join("sessions as sess", "sess.id", "se.session_id")
    .where({ "sess.owner_id": userId, "sess.status": "completed" })
    .whereNotNull("sess.completed_at")
    .andWhere("sess.completed_at", ">=", cutoff)
    .select(db.raw("COALESCE(SUM(s.reps),0) as total_reps"))
    .select(db.raw("COALESCE(SUM(COALESCE(s.reps,0) * COALESCE(s.weight_kg,0)),0) as total_volume"))
    .select(db.raw("COALESCE(SUM(COALESCE(s.duration_sec,0)),0) as total_duration_sec"))
    .first<SummaryRow>();

  const total_reps = Number(sums?.total_reps ?? 0);
  const total_volume = Number(sums?.total_volume ?? 0);
  const total_duration_min = Math.round((Number(sums?.total_duration_sec ?? 0) / 60) * 100) / 100;

  const avg_volume_per_session =
    sessions_completed > 0 ? Math.round((total_volume / sessions_completed) * 100) / 100 : 0;

  return {
    period,
    sessions_completed,
    total_reps,
    total_volume,
    total_duration_min,
    avg_volume_per_session,
  };
}

export async function fetchTrends(
  userId: string,
  period: number,
  groupBy: TrendGroupBy,
): Promise<TrendPoint[]> {
  const cutoff = cutoffISO(period);
  const bucket = groupBy === "week" ? "week" : "day";

  const rows = (await db("exercise_sets as s")
    .join("session_exercises as se", "se.id", "s.session_exercise_id")
    .join("sessions as sess", "sess.id", "se.session_id")
    .where({ "sess.owner_id": userId, "sess.status": "completed" })
    .whereNotNull("sess.completed_at")
    .andWhere("sess.completed_at", ">=", cutoff)
    .groupByRaw(`date_trunc('${bucket}', sess.completed_at)`)
    .select(
      db.raw(`date_trunc('${bucket}', sess.completed_at) as bucket_start`),
      db.raw("COUNT(DISTINCT sess.id) as sessions"),
      db.raw("COALESCE(SUM(COALESCE(s.reps,0) * COALESCE(s.weight_kg,0)),0) as volume"),
    )
    .orderBy("bucket_start", "asc")) as TrendRow[];

  return rows.map((row) => ({
    date: new Date(row.bucket_start).toISOString(),
    sessions: Number(row.sessions),
    volume: Number(row.volume),
  }));
}

export async function fetchExerciseBreakdown(
  userId: string,
  period: number,
): Promise<ExerciseBreakdown[]> {
  const cutoff = cutoffISO(period);

  const rows = (await db("exercise_sets as s")
    .join("session_exercises as se", "se.id", "s.session_exercise_id")
    .join("sessions as sess", "sess.id", "se.session_id")
    .join("exercises as e", "e.id", "se.exercise_id")
    .where({ "sess.owner_id": userId, "sess.status": "completed" })
    .andWhere("sess.completed_at", ">=", cutoff)
    .groupBy("e.type_code")
    .select(
      "e.type_code",
      db.raw("COUNT(DISTINCT sess.id) as sessions"),
      db.raw("COALESCE(SUM(s.reps),0) as total_reps"),
      db.raw("COALESCE(SUM(COALESCE(s.reps,0) * COALESCE(s.weight_kg,0)),0) as total_volume"),
      db.raw("COALESCE(SUM(COALESCE(s.duration_sec,0)),0) as total_duration_sec"),
    )
    .orderBy("e.type_code", "asc")) as ExerciseAggregateRow[];

  return rows.map((row) => ({
    type_code: row.type_code,
    sessions: Number(row.sessions),
    total_reps: Number(row.total_reps),
    total_volume: Number(row.total_volume),
    total_duration_min: Math.round((Number(row.total_duration_sec) / 60) * 100) / 100,
  }));
}

export async function fetchPlansProgress(userId: string): Promise<PlanProgress[]> {
  const rows = await db<PlanProgressRow>("plans")
    .select<
      PlanProgressRow[]
    >(["id", "name", "progress_percent", "session_count", "completed_count"])
    .where({ user_id: userId })
    .andWhereNot("status", "archived")
    .orderBy("start_date", "desc");

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    progress_percent: Number(row.progress_percent ?? 0),
    session_count: Number(row.session_count ?? 0),
    completed_count: Number(row.completed_count ?? 0),
  }));
}
