import { db } from '../../db/connection.js';
import { ExerciseType } from './exerciseTypes.types.js';

export async function listExerciseTypes(): Promise<ExerciseType[]> {
  return db('exercise_types').where({ is_active: true }).select('*').orderBy('name');
}

export async function getExerciseType(code: string): Promise<ExerciseType | undefined> {
  return db('exercise_types').where({ code }).first();
}

export async function createExerciseType(type: ExerciseType) {
  return db('exercise_types').insert({ ...type, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
}

export async function updateExerciseType(code: string, updates: Partial<ExerciseType>) {
  return db('exercise_types').where({ code }).update({ ...updates, updated_at: new Date().toISOString() });
}

export async function deleteExerciseType(code: string) {
  return db('exercise_types')
    .where({ code })
    .update({ is_active: false, updated_at: new Date().toISOString() });
}
export async function restoreExerciseType(code: string) {
  return db('exercise_types')
    .where({ code })
    .update({ is_active: true, updated_at: new Date().toISOString() });
}

export async function getTranslatedExerciseTypes(locale: string) {
  return db('exercise_types as t')
    .leftJoin('translations as tr', function () {
      this.on('tr.key', '=', db.raw("concat('exercise_type.', t.code, '.name')"))
          .andOn('tr.locale', '=', db.raw('?', [locale]));
    })
    .select('t.code', db.raw('COALESCE(tr.value, t.name) as name'), 't.description')
    .where({ 't.is_active': true })
    .orderBy('name');
}