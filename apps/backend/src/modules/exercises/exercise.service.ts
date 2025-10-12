import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/connection.js';
import {
  listExercises,
  getExercise,
  createExercise,
  updateExercise,
  archiveExercise,
  getExerciseRaw,
} from './exercise.repository.js';
import {
  CreateExerciseDTO,
  UpdateExerciseDTO,
  ExerciseQuery,
  PaginatedResult,
  Exercise,
} from './exercise.types.js';

export async function getAll(userId: string, query: ExerciseQuery): Promise<PaginatedResult<Exercise>> {
  return listExercises(userId, query);
}

export async function getOne(id: string, userId: string) {
  const ex = await getExercise(id, userId);
  if (!ex) throw Object.assign(new Error('Exercise not found'), { status: 404 });
  return ex;
}

export async function createOne(userId: string, dto: CreateExerciseDTO, isAdmin = false) {
  const validType = await db('exercise_types').where({ code: dto.type_code }).first();
  if (!validType) throw Object.assign(new Error('Invalid exercise type'), { status: 400 });

  const exercise: Exercise = {
    id: uuidv4(),
    name: dto.name,
    type_code: dto.type_code,
    owner_user_id: isAdmin ? (dto.owner_user_id ?? null) : userId,
    default_metrics: dto.default_metrics || {},
    is_archived: false,
  };

  await createExercise(exercise);
  // if admin created global or for another user, fetch raw; else user-scoped
  const fetchRaw = isAdmin && (exercise.owner_user_id === null || exercise.owner_user_id !== userId);
  return fetchRaw ? getExerciseRaw(exercise.id) : getExercise(exercise.id, userId);
}

export async function updateOne(id: string, userId: string, dto: UpdateExerciseDTO, isAdmin = false) {
  const rec = await getExerciseRaw(id);
  if (!rec) throw Object.assign(new Error('Exercise not found'), { status: 404 });
  const ownerId = rec.owner_user_id as string | null;
  // allow admin to override ownership; only forbid when NOT admin and not owner
  if (ownerId && ownerId !== userId && !isAdmin) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  // global (owner null) requires admin to modify
  if (!ownerId && !isAdmin) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  if (dto.type_code) {
    const validType = await db('exercise_types').where({ code: dto.type_code }).first();
      if (!validType) throw Object.assign(new Error('Invalid exercise type'), { status: 400 });
  }
  const affected = await updateExercise(id, dto);
  if (affected === 0) throw Object.assign(new Error('Exercise not found'), { status: 404 });
  // admin may be updating global; fetch with or without user scope
  return isAdmin ? getExerciseRaw(id) : getExercise(id, userId);
}

export async function archiveOne(id: string, userId: string, isAdmin = false) {
  const rec = await getExerciseRaw(id);
  if (!rec) throw Object.assign(new Error('Exercise not found'), { status: 404 });
  const ownerId = rec.owner_user_id as string | null;
  if (ownerId && ownerId !== userId && !isAdmin) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  if (!ownerId && !isAdmin) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  const affected = await archiveExercise(id);
  if (affected === 0) throw Object.assign(new Error('Exercise not found'), { status: 404 });
}
