import type { Knex } from "knex";
import { db } from "../../db/connection.js";
import type { Exercise, ExerciseQuery } from "./exercise.types.js";

function applyOwnershipFilter(
  query: Knex.QueryBuilder<Exercise, Exercise[]>,
  userId: string,
  isAdmin: boolean,
  ownerFilter?: string | null,
) {
  if (isAdmin) {
    if (ownerFilter === null) {
      query.whereNull("owner_id");
    } else if (ownerFilter) {
      query.where({ owner_id: ownerFilter });
    }
    return;
  }

  query.where((builder) => {
    builder.whereNull("owner_id").orWhere("owner_id", userId);
  });
}

export async function listExercises(userId: string, queryParams: ExerciseQuery, isAdmin: boolean) {
  const {
    q,
    type_code,
    include_archived,
    limit = 20,
    offset = 0,
    owner_id,
    muscle_group,
    equipment,
    tags,
    is_public,
  } = queryParams;

  const baseQuery = db<Exercise>("exercises");
  applyOwnershipFilter(baseQuery, userId, isAdmin, owner_id);

  if (!include_archived) {
    baseQuery.whereNull("archived_at");
  }
  if (type_code) {
    baseQuery.andWhere("type_code", type_code);
  }
  if (muscle_group) {
    baseQuery.andWhereILike("muscle_group", `%${muscle_group}%`);
  }
  if (equipment) {
    baseQuery.andWhereILike("equipment", `%${equipment}%`);
  }
  if (typeof is_public === "boolean") {
    baseQuery.andWhere("is_public", is_public);
  }
  if (tags && tags.length) {
    baseQuery.andWhereRaw("tags @> ?", [JSON.stringify(tags)]);
  }
  if (q) {
    baseQuery.andWhere(function () {
      this.whereILike("name", `%${q}%`)
        .orWhereILike("description_en", `%${q}%`)
        .orWhereILike("description_de", `%${q}%`);
    });
  }

  const totalRow = await baseQuery.clone().count<{ count: string }[]>("* as count");
  const total = totalRow.length ? parseInt(totalRow[0].count, 10) : 0;

  const data = await baseQuery
    .clone()
    .select(
      "id",
      "owner_id",
      "name",
      "type_code",
      "muscle_group",
      "equipment",
      "tags",
      "is_public",
      "description_en",
      "description_de",
      "created_at",
      "updated_at",
      "archived_at",
    )
    .orderBy("name")
    .limit(limit)
    .offset(offset);

  return { data, total, limit, offset };
}

export async function getExercise(id: string, scopeUserId: string) {
  return db<Exercise>("exercises")
    .where({ id })
    .whereNull("archived_at")
    .andWhere((builder) => {
      builder.whereNull("owner_id").orWhere("owner_id", scopeUserId);
    })
    .first();
}

export async function getExerciseRaw(id: string) {
  return db<Exercise>("exercises").where({ id }).first();
}

export async function createExercise(row: Exercise) {
  return db("exercises").insert({
    ...row,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  });
}

export async function updateExercise(id: string, updates: Partial<Exercise>) {
  return db("exercises")
    .where({ id })
    .update({ ...updates, updated_at: new Date().toISOString() });
}

export async function archiveExercise(id: string) {
  return db("exercises").where({ id }).update({
    archived_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
