import { db } from '../../db/connection';
import { PaginatedResult, Session, SessionQuery } from './sessions.types';

export async function listSessions(userId: string, q: SessionQuery): Promise<PaginatedResult<Session>> {
  const { status, plan_id, planned_from, planned_to, search, limit = 10, offset = 0 } = q;
  const filtered = db<Session>('sessions').where({ owner_id: userId });

  if (status) filtered.andWhere({ status });
  if (plan_id) filtered.andWhere({ plan_id });
  if (planned_from) filtered.andWhere('planned_at', '>=', planned_from);
  if (planned_to) filtered.andWhere('planned_at', '<=', planned_to);
  if (search) filtered.andWhereILike('title', `%${search}%`);

  const totalRow = await filtered.clone().count<{ count: string }[]>('* as count');
  const total = parseInt(totalRow[0].count, 10);

  const data = await filtered
    .clone()
    .orderBy('planned_at', 'desc')
    .limit(limit)
    .offset(offset);

  return { data, total, limit, offset };
}

export async function getSessionById(id: string, userId: string): Promise<Session | undefined> {
  return db<Session>('sessions').where({ id, owner_id: userId }).first();
}

export async function createSession(row: Session) {
  return db('sessions').insert(row);
}

export async function updateSession(id: string, userId: string, updates: Partial<Session>) {
  return db('sessions')
    .where({ id, owner_id: userId })
    .update({ ...updates, updated_at: new Date().toISOString() });
}

export async function cancelSession(id: string, userId: string) {
  return db('sessions')
    .where({ id, owner_id: userId })
    .update({ status: 'canceled', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() });
}

export async function listSessionSets(sessionId: string) {
  return db('exercise_sets as s')
    .leftJoin('session_exercises as se', 'se.id', 's.session_exercise_id')
    .leftJoin('exercises as e', 'e.id', 'se.exercise_id')
    .select(
      's.id',
      'e.id as exercise_id',
      'e.name as exercise_name',
      'e.type_code',
      's.order_index',
      's.reps',
      's.weight_kg',
      's.distance_m',
      's.duration_sec',
      's.rpe',
      's.notes'
    )
    .where('se.session_id', sessionId)
    .orderBy([
      { column: 'se.order_index', order: 'asc' },
      { column: 's.order_index', order: 'asc' },
    ]);
}


