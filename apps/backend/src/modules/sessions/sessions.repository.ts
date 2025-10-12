import { db } from '../../db/connection';
import { PaginatedResult, Session, SessionQuery } from './sessions.types';

export async function listSessions(userId: string, q: SessionQuery): Promise<PaginatedResult<Session>> {
  const { status, plan_id, date_from, date_to, search, limit = 10, offset = 0 } = q;
  const filtered = db('sessions').where({ user_id: userId });

  if (status) filtered.andWhere({ status });
  if (plan_id) filtered.andWhere({ plan_id });
  if (date_from) filtered.andWhere('date', '>=', date_from);
  if (date_to) filtered.andWhere('date', '<=', date_to);
  if (search) filtered.andWhereILike('name', `%${search}%`);

  const totalRow = await filtered.clone().count<{ count: string }[]>('* as count');
  const total = parseInt(totalRow[0].count, 10);

  const data = await filtered
    .clone()
    .select('*')
    .orderBy('date', 'desc')
    .limit(limit)
    .offset(offset);

  return { data, total, limit, offset };
}

export async function getSessionById(id: string, userId: string): Promise<Session | undefined> {
  return db('sessions').where({ id, user_id: userId }).first();
}

export async function createSession(row: Session) {
  return db('sessions').insert({
    ...row,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function updateSession(id: string, userId: string, updates: Partial<Session>) {
  return db('sessions')
    .where({ id, user_id: userId })
    .update({ ...updates, updated_at: new Date().toISOString() });
}

export async function cancelSession(id: string, userId: string) {
  return db('sessions')
    .where({ id, user_id: userId })
    .update({ status: 'canceled', updated_at: new Date().toISOString() });
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
      's.set_index',
      's.reps',
      's.weight',
      's.duration_sec',
      's.rpe',
      's.notes'
    )
    .where('se.session_id', sessionId)
    .orderBy(['se.id', 's.set_index']);
}
