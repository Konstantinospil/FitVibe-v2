import { db } from '../../db/connection.js';
import { Exercise, ExerciseQuery } from './exercise.types.js';

export async function listExercises(userId: string, query: ExerciseQuery) {
  const { search, type_code, include_archived, limit = 20, offset = 0 } = query;
  const q = db('exercises')
    .where(function () {
      this.whereNull('owner_user_id').orWhere('owner_user_id', userId);
    });

  if (!include_archived) q.andWhere({ is_archived: false });
  if (type_code) q.andWhere({ type_code });
  if (search) q.andWhereILike('name', `%${search}%`);

  const total = await q.clone().count<{ count: string }[]>('* as count');
  const data = await q
    .clone()
    .select('id', 'name', 'type_code', 'owner_user_id', 'default_metrics', 'created_at', 'updated_at')
    .orderBy('name')
    .limit(limit)
    .offset(offset);

  return { data, total: parseInt(total[0].count, 10), limit, offset };
}

export async function getExercise(id: string, userId: string) {
  return db('exercises')
    .where({ id })
    .andWhere(function () {
      this.whereNull('owner_user_id').orWhere('owner_user_id', userId);
    })
    .first();
}

// add a raw fetch (no user filter) to distinguish 404 vs 403
export async function getExerciseRaw(id: string) {
  return db('exercises').where({ id }).first();
}

export async function createExercise(row: Exercise) {
  return db('exercises').insert({
    ...row,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

// return affected row counts for update/archive
export async function updateExercise(id: string, updates: Partial<Exercise>) {
  return db('exercises').where({ id }).update({ ...updates, updated_at: new Date().toISOString() });
}

export async function archiveExercise(id: string) {
  return db('exercises').where({ id }).update({ is_archived: true, updated_at: new Date().toISOString() });
}

export async function findOwner(id: string) {
  const rec = await db('exercises').where({ id }).first();
  return rec ? rec.owner_user_id : null;
}
