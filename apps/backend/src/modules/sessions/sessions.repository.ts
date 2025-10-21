import type { Knex } from "knex";
import { db } from "../../db/connection.js";
import type {
  PaginatedResult,
  Session,
  SessionExercise,
  SessionExerciseActualAttributes,
  SessionExerciseAttributes,
  SessionExerciseSet,
  SessionQuery,
  SessionWithExercises,
} from "./sessions.types";

interface SessionQueryOptions {
  includeDeleted?: boolean;
}

export interface SessionExerciseSetUpsert {
  id: string;
  order_index: number;
  reps?: number | null;
  weight_kg?: number | null;
  distance_m?: number | null;
  duration_sec?: number | null;
  rpe?: number | null;
  notes?: string | null;
}

export interface SessionExerciseUpsertInput {
  id: string;
  exercise_id: string | null;
  order_index: number;
  notes: string | null;
  planned?: SessionExerciseAttributes | null;
  actual?: SessionExerciseActualAttributes | null;
  sets: SessionExerciseSetUpsert[];
}

function executor(trx?: Knex.Transaction) {
  return trx ?? db;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function toDateString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function normalizeExtras(extras: unknown): Record<string, unknown> {
  if (!extras || typeof extras !== "object" || Array.isArray(extras)) {
    return {};
  }
  return extras as Record<string, unknown>;
}

function isAttributesEmpty(attributes?: SessionExerciseAttributes | null): boolean {
  if (!attributes) {
    return true;
  }
  const { sets, reps, load, distance, duration, rpe, rest, extras } = attributes;
  const hasValues =
    (sets !== null && sets !== undefined) ||
    (reps !== null && reps !== undefined) ||
    (load !== null && load !== undefined) ||
    (distance !== null && distance !== undefined) ||
    (duration !== null && duration !== undefined && duration !== "") ||
    (rpe !== null && rpe !== undefined) ||
    (rest !== null && rest !== undefined && rest !== "") ||
    (extras && Object.keys(extras).length > 0);
  return !hasValues;
}

function buildAttributes(
  attributes: SessionExerciseAttributes | null | undefined,
): SessionExerciseAttributes | null {
  if (!attributes) {
    return null;
  }
  const normalizedExtras = normalizeExtras(attributes.extras);
  const candidate: SessionExerciseAttributes = {
    sets: attributes.sets ?? null,
    reps: attributes.reps ?? null,
    load: attributes.load ?? null,
    distance: attributes.distance ?? null,
    duration: attributes.duration ?? null,
    rpe: attributes.rpe ?? null,
    rest: attributes.rest ?? null,
    extras: normalizedExtras,
  };
  return isAttributesEmpty(candidate) ? null : candidate;
}

function buildActualAttributes(
  attributes: SessionExerciseActualAttributes | null | undefined,
): SessionExerciseActualAttributes | null {
  if (!attributes) {
    return null;
  }
  const base = buildAttributes(attributes);
  if (!base) {
    return null;
  }
  return {
    ...base,
    recorded_at: attributes.recorded_at ?? null,
  };
}

export async function listSessions(
  userId: string,
  q: SessionQuery,
): Promise<PaginatedResult<Session>> {
  const { status, plan_id, planned_from, planned_to, search, limit = 10, offset = 0 } = q;
  const query = executor()<Session>("sessions").where({ owner_id: userId }).whereNull("deleted_at");

  if (status) {
    query.andWhere({ status });
  }
  if (plan_id) {
    query.andWhere({ plan_id });
  }
  if (planned_from) {
    query.andWhere("planned_at", ">=", planned_from);
  }
  if (planned_to) {
    query.andWhere("planned_at", "<=", planned_to);
  }
  if (search) {
    query.andWhereILike("title", `%${search}%`);
  }

  const totalRow = await query.clone().count<{ count: string }[]>("* as count");
  const total = parseInt(totalRow[0].count, 10);

  const data = await query.clone().orderBy("planned_at", "desc").limit(limit).offset(offset);

  return { data, total, limit, offset };
}

export async function getSessionById(
  id: string,
  userId: string,
  options: SessionQueryOptions = {},
  trx?: Knex.Transaction,
): Promise<Session | undefined> {
  const query = executor(trx)<Session>("sessions").where({ id, owner_id: userId });
  if (!options.includeDeleted) {
    query.whereNull("deleted_at");
  }
  return query.first();
}

type SessionExerciseRow = {
  id: string;
  session_id: string;
  exercise_id: string | null;
  order_index: number;
  notes: string | null;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
  planned_sets: number | null;
  planned_reps: number | null;
  planned_load: number | string | null;
  planned_distance: number | string | null;
  planned_duration: string | null;
  planned_rpe: number | null;
  planned_rest: string | null;
  planned_extras: unknown;
  actual_sets: number | null;
  actual_reps: number | null;
  actual_load: number | string | null;
  actual_distance: number | string | null;
  actual_duration: string | null;
  actual_rpe: number | null;
  actual_rest: string | null;
  actual_extras: unknown;
  actual_recorded_at: Date | string | null;
};

type SessionExerciseSetRow = {
  id: string;
  session_exercise_id: string;
  order_index: number;
  reps: number | null;
  weight_kg: number | string | null;
  distance_m: number | null;
  duration_sec: number | null;
  rpe: number | null;
  notes: string | null;
  created_at?: Date | string | null;
};

export async function getSessionWithDetails(
  id: string,
  userId: string,
  options: SessionQueryOptions = {},
  trx?: Knex.Transaction,
): Promise<SessionWithExercises | undefined> {
  const session = await getSessionById(id, userId, options, trx);
  if (!session) {
    return undefined;
  }

  const exec = executor(trx);
  const exerciseRows = await exec<SessionExerciseRow>("session_exercises as se")
    .leftJoin("planned_exercise_attributes as plan", "plan.session_exercise_id", "se.id")
    .leftJoin("actual_exercise_attributes as act", "act.session_exercise_id", "se.id")
    .where("se.session_id", id)
    .orderBy("se.order_index", "asc")
    .select<
      SessionExerciseRow[]
    >(["se.id as id", "se.session_id as session_id", "se.exercise_id as exercise_id", "se.order_index as order_index", "se.notes as notes", "se.created_at as created_at", "se.updated_at as updated_at", "plan.sets as planned_sets", "plan.reps as planned_reps", "plan.load as planned_load", "plan.distance as planned_distance", "plan.duration as planned_duration", "plan.rpe as planned_rpe", "plan.rest as planned_rest", "plan.extras as planned_extras", "act.sets as actual_sets", "act.reps as actual_reps", "act.load as actual_load", "act.distance as actual_distance", "act.duration as actual_duration", "act.rpe as actual_rpe", "act.rest as actual_rest", "act.extras as actual_extras", "act.recorded_at as actual_recorded_at"]);

  const exerciseIds = exerciseRows.map((row) => row.id);

  const setRows = exerciseIds.length
    ? await exec<SessionExerciseSetRow>("exercise_sets")
        .whereIn("session_exercise_id", exerciseIds)
        .orderBy([
          { column: "session_exercise_id", order: "asc" },
          { column: "order_index", order: "asc" },
        ])
        .select([
          "id",
          "session_exercise_id",
          "order_index",
          "reps",
          "weight_kg",
          "distance_m",
          "duration_sec",
          "rpe",
          "notes",
          "created_at",
        ])
    : [];

  const setsByExercise = new Map<string, SessionExerciseSet[]>();
  for (const row of setRows) {
    const list = setsByExercise.get(row.session_exercise_id) ?? [];
    list.push({
      id: row.id,
      order_index: row.order_index,
      reps: row.reps ?? null,
      weight_kg: toNumber(row.weight_kg),
      distance_m: row.distance_m ?? null,
      duration_sec: row.duration_sec ?? null,
      rpe: row.rpe ?? null,
      notes: row.notes ?? null,
      created_at: toDateString(row.created_at),
    });
    setsByExercise.set(row.session_exercise_id, list);
  }

  const exercises: SessionExercise[] = exerciseRows.map((row) => {
    const planned: SessionExerciseAttributes | null = buildAttributes({
      sets: row.planned_sets ?? null,
      reps: row.planned_reps ?? null,
      load: toNumber(row.planned_load),
      distance: toNumber(row.planned_distance),
      duration: row.planned_duration ?? null,
      rpe: row.planned_rpe ?? null,
      rest: row.planned_rest ?? null,
      extras: normalizeExtras(row.planned_extras),
    });

    const actual: SessionExerciseActualAttributes | null = buildActualAttributes({
      sets: row.actual_sets ?? null,
      reps: row.actual_reps ?? null,
      load: toNumber(row.actual_load),
      distance: toNumber(row.actual_distance),
      duration: row.actual_duration ?? null,
      rpe: row.actual_rpe ?? null,
      rest: row.actual_rest ?? null,
      extras: normalizeExtras(row.actual_extras),
      recorded_at: toDateString(row.actual_recorded_at) ?? null,
    });

    return {
      id: row.id,
      session_id: row.session_id,
      exercise_id: row.exercise_id,
      order_index: row.order_index,
      notes: row.notes ?? null,
      created_at: toDateString(row.created_at),
      updated_at: toDateString(row.updated_at),
      planned,
      actual,
      sets: setsByExercise.get(row.id) ?? [],
    };
  });

  return {
    ...session,
    exercises,
  };
}

export async function createSession(row: Session, trx?: Knex.Transaction) {
  return executor(trx)("sessions").insert(row);
}

export async function updateSession(
  id: string,
  userId: string,
  updates: Partial<Session>,
  trx?: Knex.Transaction,
) {
  return executor(trx)("sessions")
    .where({ id, owner_id: userId })
    .whereNull("deleted_at")
    .update({ ...updates, updated_at: new Date().toISOString() });
}

export async function cancelSession(id: string, userId: string, trx?: Knex.Transaction) {
  const timestamp = new Date().toISOString();
  return executor(trx)("sessions").where({ id, owner_id: userId }).whereNull("deleted_at").update({
    status: "canceled",
    deleted_at: timestamp,
    updated_at: timestamp,
  });
}

export async function refreshSessionSummary(): Promise<void> {
  await db.raw("SELECT public.refresh_session_summary(TRUE);");
}

export async function sessionsExistAtDates(
  userId: string,
  plannedDates: string[],
  trx?: Knex.Transaction,
): Promise<string[]> {
  if (!plannedDates.length) {
    return [];
  }

  const rows = (await executor(trx)("sessions")
    .select("planned_at")
    .where({ owner_id: userId })
    .whereNull("deleted_at")
    .whereIn("planned_at", plannedDates)) as Array<{ planned_at: Date | string }>;

  return rows.map(({ planned_at }) => {
    if (planned_at instanceof Date) {
      return planned_at.toISOString();
    }
    return new Date(planned_at).toISOString();
  });
}

export async function replaceSessionExercises(
  trx: Knex.Transaction,
  sessionId: string,
  exercises: SessionExerciseUpsertInput[],
): Promise<void> {
  await trx("session_exercises").where({ session_id: sessionId }).del();

  if (!exercises.length) {
    return;
  }

  const timestamp = new Date().toISOString();

  await trx("session_exercises").insert(
    exercises.map((exercise) => ({
      id: exercise.id,
      session_id: sessionId,
      exercise_id: exercise.exercise_id,
      order_index: exercise.order_index,
      notes: exercise.notes,
      created_at: timestamp,
      updated_at: timestamp,
    })),
  );

  const plannedRows = exercises
    .map((exercise) => {
      const planned = buildAttributes(exercise.planned);
      if (!planned) {
        return null;
      }
      return {
        session_exercise_id: exercise.id,
        sets: planned.sets,
        reps: planned.reps,
        load: planned.load,
        distance: planned.distance,
        duration: planned.duration,
        rpe: planned.rpe,
        rest: planned.rest,
        extras: planned.extras ?? {},
        created_at: timestamp,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (plannedRows.length) {
    await trx("planned_exercise_attributes").insert(plannedRows);
  }

  const actualRows = exercises
    .map((exercise) => {
      const actual = buildActualAttributes(exercise.actual);
      if (!actual) {
        return null;
      }
      return {
        session_exercise_id: exercise.id,
        sets: actual.sets,
        reps: actual.reps,
        load: actual.load,
        distance: actual.distance,
        duration: actual.duration,
        rpe: actual.rpe,
        rest: actual.rest,
        extras: actual.extras ?? {},
        recorded_at: actual.recorded_at ?? timestamp,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (actualRows.length) {
    await trx("actual_exercise_attributes").insert(actualRows);
  }

  const setRows = exercises.flatMap((exercise) =>
    exercise.sets.map((set) => ({
      id: set.id,
      session_exercise_id: exercise.id,
      order_index: set.order_index,
      reps: set.reps ?? null,
      weight_kg: set.weight_kg ?? null,
      distance_m: set.distance_m ?? null,
      duration_sec: set.duration_sec ?? null,
      rpe: set.rpe ?? null,
      notes: set.notes ?? null,
      created_at: timestamp,
    })),
  );

  if (setRows.length) {
    await trx("exercise_sets").insert(setRows);
  }
}

export async function listSessionSets(sessionId: string, trx?: Knex.Transaction) {
  return executor(trx)("exercise_sets as s")
    .leftJoin("session_exercises as se", "se.id", "s.session_exercise_id")
    .leftJoin("exercises as e", "e.id", "se.exercise_id")
    .select(
      "s.id",
      "e.id as exercise_id",
      "e.name as exercise_name",
      "e.type_code",
      "s.order_index",
      "s.reps",
      "s.weight_kg",
      "s.distance_m",
      "s.duration_sec",
      "s.rpe",
      "s.notes",
    )
    .where("se.session_id", sessionId)
    .orderBy([
      { column: "se.order_index", order: "asc" },
      { column: "s.order_index", order: "asc" },
    ]);
}
