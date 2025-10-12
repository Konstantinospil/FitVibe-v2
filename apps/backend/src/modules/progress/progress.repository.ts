import { db } from '../../db/connection';
import { ExerciseBreakdown, PlanProgress, ProgressSummary, TrendGroupBy, TrendPoint } from './progress.types';

function cutoffISO(periodDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - periodDays);
  return d.toISOString();
}

export async function fetchSummary(userId: string, period: number): Promise<ProgressSummary> {
  const cutoff = cutoffISO(period);

  const sessionsRow = await db('sessions as sess')
    .count<{ count: string }[]>('* as count')
    .where({ 'sess.user_id': userId, 'sess.status': 'completed' })
    .andWhere('sess.date', '>=', cutoff)
    .first();

  const sessions_completed = parseInt(sessionsRow?.count ?? '0', 10);

  const sums = await db('exercise_sets as s')
    .join('session_exercises as se', 'se.id', 's.session_exercise_id')
    .join('sessions as sess', 'sess.id', 'se.session_id')
    .where({ 'sess.user_id': userId, 'sess.status': 'completed' })
    .andWhere('sess.date', '>=', cutoff)
    .select(db.raw('COALESCE(SUM(s.reps),0) as total_reps'))
    .select(db.raw('COALESCE(SUM(COALESCE(s.reps,0) * COALESCE(s.weight,0)),0) as total_volume'))
    .select(db.raw('COALESCE(SUM(COALESCE(s.duration_sec,0)),0) as total_duration_sec'))
    .first();

  const total_reps = Number((sums as any)?.total_reps ?? 0);
  const total_volume = Number((sums as any)?.total_volume ?? 0);
  const total_duration_min = Math.round((Number((sums as any)?.total_duration_sec ?? 0) / 60) * 100) / 100;

  const avg_volume_per_session = sessions_completed > 0
    ? Math.round((total_volume / sessions_completed) * 100) / 100
    : 0;

  return {
    period,
    sessions_completed,
    total_reps,
    total_volume,
    total_duration_min,
    avg_volume_per_session
  };
}

export async function fetchTrends(userId: string, period: number, groupBy: TrendGroupBy): Promise<TrendPoint[]> {
  const cutoff = cutoffISO(period);
  const bucket = groupBy === 'week' ? 'week' : 'day';

  const rows = await db('exercise_sets as s')
    .join('session_exercises as se', 'se.id', 's.session_exercise_id')
    .join('sessions as sess', 'sess.id', 'se.session_id')
    .where({ 'sess.user_id': userId, 'sess.status': 'completed' })
    .andWhere('sess.date', '>=', cutoff)
    .groupByRaw(`date_trunc('${bucket}', sess.date)`)
    .select(db.raw(`date_trunc('${bucket}', sess.date) as bucket_start`))
    .select(db.raw('COUNT(DISTINCT sess.id) as sessions'))
    .select(db.raw('COALESCE(SUM(COALESCE(s.reps,0) * COALESCE(s.weight,0)),0) as volume'))
    .orderBy('bucket_start', 'asc');

  return rows.map((r: any) => ({
    date: new Date(r.bucket_start).toISOString(),
    sessions: Number(r.sessions),
    volume: Number(r.volume),
  }));
}

export async function fetchExerciseBreakdown(userId: string, period: number): Promise<ExerciseBreakdown[]> {
  const cutoff = cutoffISO(period);

  const rows = await db('exercise_sets as s')
    .join('session_exercises as se', 'se.id', 's.session_exercise_id')
    .join('sessions as sess', 'sess.id', 'se.session_id')
    .join('exercises as e', 'e.id', 'se.exercise_id')
    .where({ 'sess.user_id': userId, 'sess.status': 'completed' })
    .andWhere('sess.date', '>=', cutoff)
    .groupBy('e.type_code')
    .select('e.type_code')
    .select(db.raw('COUNT(DISTINCT sess.id) as sessions'))
    .select(db.raw('COALESCE(SUM(s.reps),0) as total_reps'))
    .select(db.raw('COALESCE(SUM(COALESCE(s.reps,0) * COALESCE(s.weight,0)),0) as total_volume'))
    .select(db.raw('COALESCE(SUM(COALESCE(s.duration_sec,0)),0) as total_duration_sec'))
    .orderBy('e.type_code', 'asc');

  return rows.map((r: any) => ({
    type_code: r.type_code,
    sessions: Number(r.sessions),
    total_reps: Number(r.total_reps),
    total_volume: Number(r.total_volume),
    total_duration_min: Math.round((Number(r.total_duration_sec) / 60) * 100) / 100
  }));
}

export async function fetchPlansProgress(userId: string): Promise<PlanProgress[]> {
  const rows = await db('plans')
    .select('id', 'name', 'progress_percent', 'session_count', 'completed_count')
    .where({ user_id: userId })
    .andWhereNot('status', 'archived')
    .orderBy('start_date', 'desc');

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    progress_percent: Number(r.progress_percent ?? 0),
    session_count: Number(r.session_count ?? 0),
    completed_count: Number(r.completed_count ?? 0),
  }));
}
