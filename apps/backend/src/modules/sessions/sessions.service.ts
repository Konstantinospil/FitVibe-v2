import type { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/connection.js";
import {
  listSessions,
  getSessionById,
  getSessionWithDetails,
  createSession,
  updateSession,
  cancelSession,
  replaceSessionExercises,
  refreshSessionSummary,
  sessionsExistAtDates,
  type SessionExerciseUpsertInput,
} from "./sessions.repository";
import type {
  CreateSessionDTO,
  UpdateSessionDTO,
  CloneSessionDTO,
  SessionRecurrenceDTO,
  Session,
  SessionQuery,
  PaginatedResult,
  SessionExerciseInput,
  SessionExerciseAttributesInput,
  SessionExerciseActualInput,
  SessionWithExercises,
  SessionExercise,
} from "./sessions.types";
import { recomputeProgress } from "../plans/plans.service";
import { awardPointsForSession } from "../points/points.service.js";
import { insertAudit } from "../common/audit.util.js";
import { HttpError } from "../../utils/http.js";

const allowedTransitions: Record<string, string[]> = {
  planned: ["in_progress", "completed", "canceled"],
  in_progress: ["completed", "canceled"],
  completed: [],
  canceled: [],
};

const intervalPattern =
  /^(?:P(?!$)(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?|(?:\d{2}):(?:\d{2})(?::(?:\d{2}))?)$/;

function trimToNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function ensureNonNegativeNumber(
  name: string,
  value: number | null | undefined,
  context: string,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (Number.isNaN(value) || value < 0) {
    throw new HttpError(422, "E.SESSION.INVALID_SET", `${context}: ${name} cannot be negative`);
  }
  return value;
}

function ensureNonNegativeInteger(
  name: string,
  value: number | null | undefined,
  context: string,
): number | null {
  const normalized = ensureNonNegativeNumber(name, value, context);
  if (normalized === null) {
    return null;
  }
  if (!Number.isInteger(normalized)) {
    throw new HttpError(422, "E.SESSION.INVALID_SET", `${context}: ${name} must be an integer`);
  }
  return normalized;
}

function ensureRpeRange(
  name: string,
  value: number | null | undefined,
  context: string,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw new HttpError(422, "E.SESSION.INVALID_SET", `${context}: ${name} must be 1-10`);
  }
  return value;
}

function validateInterval(
  name: string,
  value: string | null | undefined,
  context: string,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!intervalPattern.test(value)) {
    throw new HttpError(
      422,
      "E.SESSION.INVALID_SET",
      `${context}: ${name} must be ISO 8601 duration or HH:MM[:SS]`,
    );
  }
  return value;
}

function normalizeExtras(extras: unknown): Record<string, unknown> {
  if (!extras || typeof extras !== "object" || Array.isArray(extras)) {
    return {};
  }
  return extras as Record<string, unknown>;
}

type PlanRow = { id: string; user_id: string };

async function ensurePlanExists(
  trx: Knex.Transaction,
  planId: string,
  ownerId: string,
): Promise<void> {
  const plan = await trx<PlanRow>("plans")
    .select("id")
    .where({ id: planId, user_id: ownerId })
    .first();
  if (!plan) {
    throw new HttpError(400, "E.SESSION.INVALID_PLAN", "Invalid plan");
  }
}

function normalizeAttributesInput(
  input: SessionExerciseAttributesInput | null | undefined,
  context: string,
) {
  if (!input) {
    return null;
  }

  const normalized = {
    sets: ensureNonNegativeInteger("sets", input.sets, context),
    reps: ensureNonNegativeInteger("reps", input.reps, context),
    load: ensureNonNegativeNumber("load", input.load, context),
    distance: ensureNonNegativeNumber("distance", input.distance, context),
    duration: validateInterval("duration", input.duration ?? null, context),
    rpe: ensureRpeRange("rpe", input.rpe, context),
    rest: validateInterval("rest", input.rest ?? null, context),
    extras: normalizeExtras(input.extras),
  };

  const hasValue =
    normalized.sets !== null ||
    normalized.reps !== null ||
    normalized.load !== null ||
    normalized.distance !== null ||
    (normalized.duration && normalized.duration.length > 0) ||
    normalized.rpe !== null ||
    (normalized.rest && normalized.rest.length > 0) ||
    Object.keys(normalized.extras).length > 0;

  return hasValue ? normalized : null;
}

function normalizeActualAttributesInput(
  input: SessionExerciseActualInput | null | undefined,
  context: string,
) {
  const base = normalizeAttributesInput(input, context);
  if (!base) {
    return null;
  }
  const recordedAt =
    input?.recorded_at && input.recorded_at.length
      ? new Date(input.recorded_at).toISOString()
      : null;
  return {
    ...base,
    recorded_at: recordedAt,
  };
}

function normalizeSets(
  sets: SessionExerciseInput["sets"],
  context: string,
): SessionExerciseUpsertInput["sets"] {
  if (!sets || sets.length === 0) {
    return [];
  }
  const seenOrders = new Set<number>();

  const normalized = sets.map((set, index) => {
    const setContext = `${context} set #${index + 1}`;
    const order = ensureNonNegativeInteger("order", set.order, setContext);
    if (order === null || order < 1) {
      throw new HttpError(422, "E.SESSION.INVALID_SET", `${setContext}: order must be >= 1`);
    }
    if (seenOrders.has(order)) {
      throw new HttpError(422, "E.SESSION.INVALID_SET", `${context}: duplicate set order ${order}`);
    }
    seenOrders.add(order);

    return {
      id: set.id ?? uuidv4(),
      order_index: order,
      reps: ensureNonNegativeInteger("reps", set.reps ?? null, setContext),
      weight_kg: ensureNonNegativeNumber("weight_kg", set.weight_kg ?? null, setContext),
      distance_m: ensureNonNegativeInteger("distance_m", set.distance_m ?? null, setContext),
      duration_sec: ensureNonNegativeInteger("duration_sec", set.duration_sec ?? null, setContext),
      rpe: ensureRpeRange("rpe", set.rpe ?? null, setContext),
      notes: trimToNull(set.notes),
    };
  });

  normalized.sort((a, b) => a.order_index - b.order_index);
  return normalized;
}

function normalizeSessionExercises(
  exercises?: SessionExerciseInput[],
): SessionExerciseUpsertInput[] {
  if (!exercises || exercises.length === 0) {
    return [];
  }

  const seenOrders = new Set<number>();

  const normalized = exercises.map((exercise, index) => {
    const context = `exercise #${index + 1}`;
    const order = ensureNonNegativeInteger("order", exercise.order, context);
    if (order === null || order < 1) {
      throw new HttpError(422, "E.SESSION.INVALID_SET", `${context}: order must be >= 1`);
    }
    if (seenOrders.has(order)) {
      throw new HttpError(422, "E.SESSION.INVALID_SET", `Duplicate exercise order ${order}`);
    }
    seenOrders.add(order);

    return {
      id: exercise.id ?? uuidv4(),
      exercise_id: exercise.exercise_id ?? null,
      order_index: order,
      notes: trimToNull(exercise.notes),
      planned: normalizeAttributesInput(exercise.planned ?? null, `${context} planned`),
      actual: normalizeActualAttributesInput(exercise.actual ?? null, `${context} actual`),
      sets: normalizeSets(exercise.sets, context),
    };
  });

  normalized.sort((a, b) => a.order_index - b.order_index);
  return normalized;
}

function convertExistingExerciseToInput(
  exercise: SessionExercise,
  includeActual: boolean,
): SessionExerciseInput {
  return {
    order: exercise.order_index,
    exercise_id: exercise.exercise_id ?? undefined,
    notes: exercise.notes ?? undefined,
    planned: exercise.planned ?? undefined,
    actual: includeActual ? (exercise.actual ?? undefined) : null,
    sets:
      exercise.sets?.map((set) => ({
        order: set.order_index,
        reps: set.reps ?? undefined,
        weight_kg: set.weight_kg ?? undefined,
        distance_m: set.distance_m ?? undefined,
        duration_sec: set.duration_sec ?? undefined,
        rpe: set.rpe ?? undefined,
        notes: set.notes ?? undefined,
      })) ?? [],
  };
}

function cloneExerciseInputsForReuse(inputs: SessionExerciseInput[]): SessionExerciseInput[] {
  return inputs.map((exercise) => ({
    ...exercise,
    sets: exercise.sets
      ? exercise.sets.map((set) => ({
          ...set,
        }))
      : undefined,
    planned: exercise.planned
      ? {
          ...exercise.planned,
          extras: exercise.planned.extras ? { ...exercise.planned.extras } : undefined,
        }
      : undefined,
    actual: exercise.actual
      ? {
          ...exercise.actual,
          extras: exercise.actual.extras ? { ...exercise.actual.extras } : undefined,
        }
      : exercise.actual,
  }));
}

export async function getAll(
  userId: string,
  query: SessionQuery,
): Promise<PaginatedResult<Session>> {
  return listSessions(userId, query);
}

export async function getOne(userId: string, id: string): Promise<SessionWithExercises> {
  const session = await getSessionWithDetails(id, userId);
  if (!session) {
    throw new HttpError(404, "E.SESSION.NOT_FOUND", "Session not found");
  }
  return session;
}

export async function createOne(
  userId: string,
  dto: CreateSessionDTO,
): Promise<SessionWithExercises> {
  const normalizedExercises = normalizeSessionExercises(dto.exercises);
  const sessionId = uuidv4();
  const now = new Date();
  const timestamp = now.toISOString();

  const row: Session = {
    id: sessionId,
    owner_id: userId,
    plan_id: dto.plan_id ?? null,
    title: trimToNull(dto.title),
    planned_at: new Date(dto.planned_at).toISOString(),
    status: "planned",
    visibility: dto.visibility ?? "private",
    notes: trimToNull(dto.notes),
    recurrence_rule: trimToNull(dto.recurrence_rule),
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.transaction(async (trx) => {
    if (row.plan_id) {
      await ensurePlanExists(trx, row.plan_id, userId);
    }

    await createSession(row, trx);
    if (normalizedExercises.length > 0) {
      await replaceSessionExercises(trx, sessionId, normalizedExercises);
    }
  });

  await insertAudit({
    actorUserId: userId,
    entity: "sessions",
    action: "create",
    entityId: sessionId,
    metadata: {
      title: row.title,
      plan_id: row.plan_id,
      planned_at: row.planned_at,
      visibility: row.visibility,
      recurrence_rule: row.recurrence_rule,
      exercise_count: normalizedExercises.length,
    },
  });

  if (row.plan_id) {
    await recomputeProgress(userId, row.plan_id);
  }

  const created = await getSessionWithDetails(sessionId, userId);
  if (!created) {
    throw new HttpError(500, "E.SESSION.CREATE_FAILED", "Unable to load created session");
  }

  if (normalizedExercises.length > 0 || created.status === "completed") {
    await refreshSessionSummary();
  }

  return created;
}

export async function updateOne(
  userId: string,
  id: string,
  dto: UpdateSessionDTO,
): Promise<SessionWithExercises> {
  const current = await getSessionById(id, userId);
  if (!current) {
    throw new HttpError(404, "E.SESSION.NOT_FOUND", "Session not found");
  }

  const normalizedExercises = dto.exercises ? normalizeSessionExercises(dto.exercises) : null;

  const targetStatus = dto.status;
  let targetStartedAt = dto.started_at;
  let targetCompletedAt = dto.completed_at;
  let targetDeletedAt: string | null | undefined;

  if (targetStatus && targetStatus !== current.status) {
    const allowed = allowedTransitions[current.status] ?? [];
    if (!allowed.includes(targetStatus)) {
      throw new HttpError(
        400,
        "E.SESSION.INVALID_STATUS",
        `Invalid status transition: ${current.status} -> ${targetStatus}`,
      );
    }

    const nowIso = new Date().toISOString();
    if (targetStatus === "in_progress" && !targetStartedAt) {
      targetStartedAt = nowIso;
    }
    if (targetStatus === "completed" && !targetCompletedAt) {
      targetCompletedAt = nowIso;
    }
    if (targetStatus === "canceled") {
      targetDeletedAt = nowIso;
    }
  }

  const updates: Partial<Session> = {
    updated_at: new Date().toISOString(),
  };

  if (dto.plan_id !== undefined) {
    updates.plan_id = dto.plan_id ?? null;
  }
  if (dto.title !== undefined) {
    updates.title = trimToNull(dto.title);
  }
  if (dto.planned_at) {
    updates.planned_at = new Date(dto.planned_at).toISOString();
  }
  if (targetStatus) {
    updates.status = targetStatus;
  }
  if (dto.visibility) {
    updates.visibility = dto.visibility;
  }
  if (dto.notes !== undefined) {
    updates.notes = trimToNull(dto.notes);
  }
  if (dto.recurrence_rule !== undefined) {
    updates.recurrence_rule = trimToNull(dto.recurrence_rule);
  }
  if (targetStartedAt !== undefined) {
    updates.started_at = targetStartedAt ? new Date(targetStartedAt).toISOString() : null;
  }
  if (targetCompletedAt !== undefined) {
    updates.completed_at = targetCompletedAt ? new Date(targetCompletedAt).toISOString() : null;
  }
  if (dto.calories !== undefined) {
    updates.calories = ensureNonNegativeInteger("calories", dto.calories, "session") ?? null;
  }
  if (targetDeletedAt !== undefined) {
    updates.deleted_at = targetDeletedAt;
  }

  await db.transaction(async (trx) => {
    if (dto.plan_id) {
      await ensurePlanExists(trx, dto.plan_id, userId);
    }

    const affected = await updateSession(id, userId, updates, trx);
    if (affected === 0) {
      throw new HttpError(404, "E.SESSION.NOT_FOUND", "Session not found");
    }

    if (normalizedExercises !== null) {
      await replaceSessionExercises(trx, id, normalizedExercises);
    }
  });

  const includeDeleted = targetStatus === "canceled";
  const updated = await getSessionWithDetails(id, userId, { includeDeleted });
  if (!updated) {
    throw new HttpError(500, "E.SESSION.UPDATE_FAILED", "Unable to load updated session");
  }

  const statusChanged = current.status !== updated.status;
  const exercisesTouched = normalizedExercises !== null;

  const shouldAwardPoints =
    updated.status === "completed" &&
    (statusChanged || current.points === null || current.points === undefined);

  if (shouldAwardPoints) {
    const awardResult = await awardPointsForSession(updated);
    if (awardResult.pointsAwarded !== null) {
      updated.points = awardResult.pointsAwarded;
    }
  }

  if (statusChanged || exercisesTouched) {
    await refreshSessionSummary();
  }

  await insertAudit({
    actorUserId: userId,
    entity: "sessions",
    action: "update",
    entityId: id,
    metadata: {
      changes: dto,
      exercise_count: dto.exercises ? dto.exercises.length : undefined,
    },
  });

  const planIdsToRecompute = new Set<string>();
  if (current.plan_id && current.plan_id !== updated.plan_id) {
    planIdsToRecompute.add(current.plan_id);
  }
  if (updated.plan_id) {
    planIdsToRecompute.add(updated.plan_id);
  }
  for (const planId of planIdsToRecompute) {
    await recomputeProgress(userId, planId);
  }

  return updated;
}

export async function cloneOne(
  userId: string,
  sourceId: string,
  dto: CloneSessionDTO,
): Promise<SessionWithExercises> {
  const source = await getSessionWithDetails(sourceId, userId);
  if (!source) {
    throw new HttpError(404, "E.SESSION.NOT_FOUND", "Session not found");
  }

  const includeActual = dto.include_actual ?? false;

  const targetPlanId = dto.plan_id !== undefined ? (dto.plan_id ?? null) : (source.plan_id ?? null);
  const planChanged = targetPlanId !== (source.plan_id ?? null);

  const normalizedExercises = normalizeSessionExercises(
    source.exercises.map((exercise) => convertExistingExerciseToInput(exercise, includeActual)),
  );

  let plannedAt: string;
  if (dto.planned_at) {
    plannedAt = new Date(dto.planned_at).toISOString();
  } else if (dto.date_offset_days !== undefined) {
    const base = new Date(source.planned_at);
    base.setUTCDate(base.getUTCDate() + dto.date_offset_days);
    plannedAt = base.toISOString();
  } else {
    plannedAt = new Date(source.planned_at).toISOString();
  }

  const sessionId = uuidv4();
  const timestamp = new Date().toISOString();
  const row: Session = {
    id: sessionId,
    owner_id: userId,
    plan_id: targetPlanId ?? null,
    title: dto.title !== undefined ? trimToNull(dto.title) : trimToNull(source.title ?? null),
    planned_at: plannedAt,
    status: "planned",
    visibility: dto.visibility ?? source.visibility ?? "private",
    notes: dto.notes !== undefined ? trimToNull(dto.notes) : trimToNull(source.notes ?? null),
    recurrence_rule:
      dto.recurrence_rule !== undefined
        ? trimToNull(dto.recurrence_rule)
        : trimToNull(source.recurrence_rule ?? null),
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.transaction(async (trx) => {
    if (planChanged && targetPlanId) {
      await ensurePlanExists(trx, targetPlanId, userId);
    }

    await createSession(row, trx);
    if (normalizedExercises.length > 0) {
      await replaceSessionExercises(trx, sessionId, normalizedExercises);
    }
  });

  const cloned = await getSessionWithDetails(sessionId, userId);
  if (!cloned) {
    throw new HttpError(500, "E.SESSION.CLONE_FAILED", "Unable to load cloned session");
  }

  await insertAudit({
    actorUserId: userId,
    entity: "sessions",
    action: "clone",
    entityId: sessionId,
    metadata: {
      source_id: sourceId,
      plan_id: cloned.plan_id,
      include_actual: includeActual,
    },
  });

  if (cloned.plan_id) {
    await recomputeProgress(userId, cloned.plan_id);
  }

  if (normalizedExercises.length > 0) {
    await refreshSessionSummary();
  }

  return cloned;
}

function addDays(base: Date, days: number): Date {
  const clone = new Date(base.getTime());
  clone.setUTCDate(clone.getUTCDate() + days);
  return clone;
}

export async function applyRecurrence(
  userId: string,
  sourceId: string,
  dto: SessionRecurrenceDTO,
): Promise<SessionWithExercises[]> {
  if (!Number.isInteger(dto.occurrences) || dto.occurrences < 1 || dto.occurrences > 52) {
    throw new HttpError(
      400,
      "E.SESSION.RECURRENCE_INVALID",
      "occurrences must be between 1 and 52",
    );
  }

  if (!Number.isInteger(dto.offset_days) || dto.offset_days < 1 || dto.offset_days > 180) {
    throw new HttpError(
      400,
      "E.SESSION.RECURRENCE_INVALID",
      "offset_days must be between 1 and 180",
    );
  }

  if (dto.offset_days * dto.occurrences > 365) {
    throw new HttpError(400, "E.SESSION.RECURRENCE_INVALID", "Recurrence horizon exceeds one year");
  }

  const source = await getSessionWithDetails(sourceId, userId);
  if (!source) {
    throw new HttpError(404, "E.SESSION.NOT_FOUND", "Session not found");
  }
  if (source.status === "canceled") {
    throw new HttpError(
      400,
      "E.SESSION.RECURRENCE_SOURCE_INVALID",
      "Cannot create recurrence from a canceled session",
    );
  }

  const includeActual = dto.include_actual ?? false;
  const targetPlanId = dto.plan_id !== undefined ? (dto.plan_id ?? null) : (source.plan_id ?? null);

  const baseExercisesInput = source.exercises
    ? source.exercises.map((exercise) => convertExistingExerciseToInput(exercise, includeActual))
    : [];

  const baseDate = new Date(source.planned_at);
  if (Number.isNaN(baseDate.getTime())) {
    throw new HttpError(500, "E.SESSION.INVALID_SOURCE", "Source session has invalid planned date");
  }

  let startDate: Date | null = null;
  if (dto.start_from) {
    startDate = new Date(dto.start_from);
    if (Number.isNaN(startDate.getTime())) {
      throw new HttpError(
        400,
        "E.SESSION.RECURRENCE_INVALID_START",
        "start_from must be a valid date",
      );
    }
  }

  const plannedDates: string[] = [];
  for (let index = 0; index < dto.occurrences; index += 1) {
    const reference = startDate ? startDate : baseDate;
    const increment = startDate ? dto.offset_days * index : dto.offset_days * (index + 1);
    const target = addDays(reference, increment);
    plannedDates.push(target.toISOString());
  }

  const baseIso = baseDate.toISOString();
  if (plannedDates.includes(baseIso)) {
    throw new HttpError(
      400,
      "E.SESSION.RECURRENCE_INVALID_START",
      "Recurrence would duplicate the source session date",
    );
  }

  const conflicts = await sessionsExistAtDates(userId, plannedDates);
  if (conflicts.length > 0) {
    throw new HttpError(
      409,
      "E.SESSION.RECURRENCE_CONFLICT",
      "A session already exists for one or more target dates",
      { conflicts },
    );
  }

  const createdSessionIds: string[] = [];
  const timestamp = new Date().toISOString();

  await db.transaction(async (trx) => {
    if (targetPlanId) {
      await ensurePlanExists(trx, targetPlanId, userId);
    }

    for (const plannedAt of plannedDates) {
      const sessionId = uuidv4();
      const row: Session = {
        id: sessionId,
        owner_id: userId,
        plan_id: targetPlanId ?? null,
        title: dto.title !== undefined ? trimToNull(dto.title) : trimToNull(source.title ?? null),
        planned_at: plannedAt,
        status: "planned",
        visibility: dto.visibility ?? source.visibility ?? "private",
        notes: dto.notes !== undefined ? trimToNull(dto.notes) : trimToNull(source.notes ?? null),
        recurrence_rule:
          dto.recurrence_rule !== undefined
            ? trimToNull(dto.recurrence_rule)
            : trimToNull(source.recurrence_rule ?? null),
        created_at: timestamp,
        updated_at: timestamp,
      };

      await createSession(row, trx);

      if (baseExercisesInput.length > 0) {
        const normalized = normalizeSessionExercises(
          cloneExerciseInputsForReuse(baseExercisesInput),
        );
        if (normalized.length > 0) {
          await replaceSessionExercises(trx, sessionId, normalized);
        }
      }

      createdSessionIds.push(sessionId);
    }
  });

  const clones: SessionWithExercises[] = [];
  for (const id of createdSessionIds) {
    const clone = await getSessionWithDetails(id, userId);
    if (!clone) {
      throw new HttpError(
        500,
        "E.SESSION.RECURRENCE_LOAD_FAILED",
        "Unable to load created recurrence session",
      );
    }
    clones.push(clone);
  }

  await insertAudit({
    actorUserId: userId,
    entity: "sessions",
    action: "recurrence_create",
    entityId: sourceId,
    metadata: {
      occurrences: dto.occurrences,
      offset_days: dto.offset_days,
      planned_dates: plannedDates,
      include_actual: includeActual,
      plan_id: targetPlanId,
    },
  });

  if (targetPlanId) {
    await recomputeProgress(userId, targetPlanId);
  }

  await refreshSessionSummary();

  return clones;
}

export async function cancelOne(userId: string, id: string): Promise<void> {
  const current = await getSessionById(id, userId);
  if (!current) {
    throw new HttpError(404, "E.SESSION.NOT_FOUND", "Session not found");
  }
  if (current.status === "completed") {
    throw new HttpError(
      400,
      "E.SESSION.CANNOT_CANCEL_COMPLETED",
      "Completed sessions cannot be canceled",
    );
  }

  const affected = await cancelSession(id, userId);
  if (affected === 0) {
    throw new HttpError(404, "E.SESSION.NOT_FOUND", "Session not found");
  }

  await insertAudit({
    actorUserId: userId,
    entity: "sessions",
    action: "cancel",
    entityId: id,
  });

  await refreshSessionSummary();

  if (current.plan_id) {
    await recomputeProgress(userId, current.plan_id);
  }
}
