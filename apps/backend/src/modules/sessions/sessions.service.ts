import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/connection';
import {
  listSessions,
  getSessionById,
  createSession,
  updateSession,
  cancelSession,
  listSessionSets
} from './sessions.repository';
import {
  CreateSessionDTO,
  UpdateSessionDTO,
  Session,
  SessionQuery,
  PaginatedResult
} from './sessions.types';
import { recomputeProgress } from '../plans/plans.service';
import { insertAudit } from '../common/audit.util';

const allowedTransitions: Record<string, string[]> = {
  planned: ['in_progress', 'completed', 'canceled'],
  in_progress: ['completed', 'canceled'],
  done: [],
  canceled: [],
};

export async function getAll(userId: string, query: SessionQuery): Promise<PaginatedResult<Session>> {
  return listSessions(userId, query);
}

export async function getOne(userId: string, id: string) {
  const session = await getSessionById(id, userId);
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  const sets = await listSessionSets(id);
  return { ...session, sets };
}

export async function createOne(userId: string, dto: CreateSessionDTO) {
  if (dto.plan_id) {
    const plan = await db('plans').where({ id: dto.plan_id, user_id: userId }).first();
    if (!plan) throw Object.assign(new Error('Invalid plan'), { status: 400 });
  }

  const row: Session = {
    id: uuidv4(),
    owner_id: userId,
    plan_id: dto.plan_id || null,
    title: dto.title,
    planned_at: new Date(dto.planned_at).toISOString(),
    status: 'planned',
    visibility: dto.visibility ?? 'private',
    notes: dto.notes ?? null,
    recurrence_rule: dto.recurrence_rule ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await createSession(row);
  await insertAudit(userId, 'session_create', row);
  if (row.plan_id) await recomputeProgress(userId, row.plan_id);

  return getSessionById(row.id, userId);
}

export async function updateOne(userId: string, id: string, dto: UpdateSessionDTO) {
  const current = await getSessionById(id, userId);
  if (!current) throw Object.assign(new Error('Session not found'), { status: 404 });

  if (dto.status && dto.status !== current.status) {
    const allowed = allowedTransitions[current.status] || [];
    if (!allowed.includes(dto.status)) {
      throw Object.assign(new Error(`Invalid status transition: ${current.status} -> ${dto.status}`), { status: 400 });
    }
    if (dto.status === 'completed' && !dto.completed_at) dto.completed_at = new Date().toISOString();
  }

  if (dto.plan_id) {
    const plan = await db('plans').where({ id: dto.plan_id, user_id: userId }).first();
    if (!plan) throw Object.assign(new Error('Invalid plan'), { status: 400 });
  }

  const affected = await updateSession(id, userId, {
    ...dto,
    planned_at: dto.planned_at ? new Date(dto.planned_at).toISOString() : undefined,
    completed_at: dto.completed_at ? new Date(dto.completed_at).toISOString() : dto.completed_at,
    started_at: dto.started_at ? new Date(dto.started_at).toISOString() : dto.started_at,
  });
  if (affected === 0) throw Object.assign(new Error('Session not found'), { status: 404 });

  const updated = await getSessionById(id, userId);
  await insertAudit(userId, 'session_update', { id, changes: dto });
  if (updated?.plan_id) await recomputeProgress(userId, updated.plan_id);
  return updated;
}

export async function cancelOne(userId: string, id: string) {
  const current = await getSessionById(id, userId);
  if (!current) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (current.status === 'completed') {
    throw Object.assign(new Error('Completed sessions cannot be canceled'), { status: 400 });
  }
  const affected = await cancelSession(id, userId);
  if (affected === 0) throw Object.assign(new Error('Session not found'), { status: 404 });
  await insertAudit(userId, 'session_cancel', { id });
  if (current.plan_id) await recomputeProgress(userId, current.plan_id);
}

