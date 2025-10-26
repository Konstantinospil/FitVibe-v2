import type { Knex } from "knex";

import { db } from "../../db/connection.js";
import type {
  BadgeAwardRecord,
  BadgeCatalogEntry,
  ExerciseMetadata,
  InsertPointsEvent,
  InsertBadgeAward,
  PointsEventRecord,
  UserPointsProfile,
} from "./points.types.js";

const TABLE = "user_points";

function executor(trx?: Knex.Transaction) {
  return trx ?? db;
}

function toIsoString(value: unknown): string {
  if (!value) {
    return new Date().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return new Date(value).toISOString();
  }
  return new Date(value as number).toISOString();
}

function toPointsEventRecord(row: any): PointsEventRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    source_type: row.source_type,
    source_id: row.source_id ?? null,
    algorithm_version: row.algorithm_version ?? null,
    points: Number(row.points),
    calories: row.calories === null || row.calories === undefined ? null : Number(row.calories),
    metadata: row.metadata ?? {},
    awarded_at: toIsoString(row.awarded_at),
    created_at: toIsoString(row.created_at),
  };
}

export async function insertPointsEvent(
  event: InsertPointsEvent,
  trx?: Knex.Transaction,
): Promise<PointsEventRecord> {
  const exec = executor(trx);
  const [row] = await exec(TABLE).insert(event).returning("*");
  return toPointsEventRecord(row);
}

export async function findPointsEventBySource(
  userId: string,
  sourceType: string,
  sourceId: string,
  trx?: Knex.Transaction,
): Promise<PointsEventRecord | undefined> {
  const exec = executor(trx);
  const row = await exec(TABLE)
    .where({
      user_id: userId,
      source_type: sourceType,
      source_id: sourceId,
    })
    .first();
  return row ? toPointsEventRecord(row) : undefined;
}

export async function getPointsBalance(userId: string, trx?: Knex.Transaction): Promise<number> {
  const exec = executor(trx);
  const result = await exec(TABLE).where({ user_id: userId }).sum<{ total: string | number }>("points as total").first();
  const value = result?.total ?? 0;
  return typeof value === "string" ? Number(value) : Number(value ?? 0);
}

export async function getRecentPointsEvents(
  userId: string,
  limit: number,
  trx?: Knex.Transaction,
): Promise<PointsEventRecord[]> {
  const exec = executor(trx);
  const rows = await exec(TABLE)
    .where({ user_id: userId })
    .orderBy("awarded_at", "desc")
    .orderBy("id", "desc")
    .limit(limit);
  return rows.map(toPointsEventRecord);
}

export interface HistoryCursor {
  awardedAt: Date;
  id: string;
}

export interface PointsHistoryOptions {
  limit: number;
  cursor?: HistoryCursor;
  from?: Date;
  to?: Date;
}

export async function getPointsHistory(
  userId: string,
  options: PointsHistoryOptions,
  trx?: Knex.Transaction,
): Promise<PointsEventRecord[]> {
  const exec = executor(trx);
  const query = exec(TABLE)
    .where({ user_id: userId })
    .orderBy("awarded_at", "desc")
    .orderBy("id", "desc")
    .limit(options.limit);

  if (options.from) {
    query.andWhere("awarded_at", ">=", options.from);
  }
  if (options.to) {
    query.andWhere("awarded_at", "<=", options.to);
  }
  if (options.cursor) {
    query.andWhere((builder) => {
      builder
        .where("awarded_at", "<", options.cursor!.awardedAt)
        .orWhere((inner) => {
          inner
            .where("awarded_at", "=", options.cursor!.awardedAt)
            .andWhere("id", "<", options.cursor!.id);
        });
    });
  }

  const rows = await query;
  return rows.map(toPointsEventRecord);
}

export async function getUserPointsProfile(
  userId: string,
  trx?: Knex.Transaction,
): Promise<UserPointsProfile> {
  const exec = executor(trx);
  const [staticRow, metricsRow] = await Promise.all([
    exec("user_static").where({ user_id: userId }).first(),
    exec("user_metrics").where({ user_id: userId }).orderBy("recorded_at", "desc").first(),
  ]);

  return {
    dateOfBirth: staticRow?.date_of_birth ?? null,
    genderCode: staticRow?.gender_code ?? null,
    fitnessLevelCode: metricsRow?.fitness_level_code ?? null,
    trainingFrequency: metricsRow?.training_frequency ?? null,
  };
}

export async function getExercisesMetadata(
  exerciseIds: string[],
  trx?: Knex.Transaction,
): Promise<Map<string, ExerciseMetadata>> {
  if (exerciseIds.length === 0) {
    return new Map();
  }
  const exec = executor(trx);
  const rows = await exec("exercises")
    .whereIn("id", exerciseIds)
    .select(["id", "type_code", "tags"]);

  const map = new Map<string, ExerciseMetadata>();
  for (const row of rows) {
    const tags: string[] = Array.isArray(row.tags)
      ? row.tags
      : typeof row.tags === "string"
        ? JSON.parse(row.tags)
        : [];
    map.set(row.id, {
      id: row.id,
      type_code: row.type_code ?? null,
      tags,
    });
  }
  return map;
}

export async function getBadgeCatalog(trx?: Knex.Transaction): Promise<Map<string, BadgeCatalogEntry>> {
  const exec = executor(trx);
  const rows = await exec("badge_catalog").select([
    "code",
    "name",
    "description",
    "category",
    "icon",
    "priority",
    "criteria",
  ]);
  const map = new Map<string, BadgeCatalogEntry>();
  for (const row of rows) {
    map.set(row.code, {
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category,
      icon: row.icon ?? null,
      priority: Number(row.priority ?? 0),
      criteria: row.criteria ?? {},
    });
  }
  return map;
}

export async function getUserBadgeCodes(userId: string, trx?: Knex.Transaction): Promise<Set<string>> {
  const exec = executor(trx);
  const rows = await exec("badges").where({ user_id: userId }).select(["badge_type"]);
  return new Set(rows.map((row) => row.badge_type as string));
}

export async function insertBadgeAward(
  award: InsertBadgeAward,
  trx?: Knex.Transaction,
): Promise<BadgeAwardRecord> {
  const exec = executor(trx);
  const [row] = await exec("badges")
    .insert({
      ...award,
      metadata: award.metadata,
    })
    .returning(["id", "user_id", "badge_type", "metadata", "awarded_at"]);

  return {
    id: row.id,
    user_id: row.user_id,
    badge_type: row.badge_type,
    metadata: row.metadata ?? {},
    awarded_at: toIsoString(row.awarded_at),
  };
}

export async function countCompletedSessions(
  userId: string,
  trx?: Knex.Transaction,
): Promise<number> {
  const exec = executor(trx);
  const row = await exec("sessions")
    .where({ owner_id: userId, status: "completed" })
    .whereNull("deleted_at")
    .count<{ count: string | number }>("id as count")
    .first();
  const value = row?.count ?? 0;
  return typeof value === "string" ? Number(value) : Number(value ?? 0);
}

export async function getCompletedSessionDatesInRange(
  userId: string,
  from: Date,
  to: Date,
  trx?: Knex.Transaction,
): Promise<Set<string>> {
  const exec = executor(trx);
  const rows = await exec("sessions")
    .where({ owner_id: userId, status: "completed" })
    .whereNull("deleted_at")
    .whereBetween("completed_at", [from, to])
    .select(exec.raw("DATE(completed_at) as day"));

  const days = new Set<string>();
  for (const row of rows) {
    const value = row.day;
    if (value instanceof Date) {
      days.add(value.toISOString().slice(0, 10));
    } else if (typeof value === "string") {
      days.add(value);
    }
  }
  return days;
}
