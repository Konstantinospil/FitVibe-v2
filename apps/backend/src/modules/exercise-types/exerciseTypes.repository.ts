import { db } from "../../db/connection.js";
import type { ExerciseType } from "./exerciseTypes.types.js";

type ExerciseTypeRow = ExerciseType & {
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
};

export async function listExerciseTypes(): Promise<ExerciseType[]> {
  const rows = await db<ExerciseTypeRow>("exercise_types")
    .where({ is_active: true })
    .orderBy("name");
  return rows.map(({ code, name, description }) => ({ code, name, description }));
}

export async function getExerciseType(code: string): Promise<ExerciseType | undefined> {
  const row = await db<ExerciseTypeRow>("exercise_types").where({ code }).first();
  return row ? { code: row.code, name: row.name, description: row.description } : undefined;
}

export async function createExerciseType(type: ExerciseType): Promise<void> {
  await db<ExerciseTypeRow>("exercise_types").insert({
    ...type,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function updateExerciseType(
  code: string,
  updates: Partial<ExerciseType>,
): Promise<number> {
  return db<ExerciseTypeRow>("exercise_types")
    .where({ code })
    .update({ ...updates, updated_at: new Date().toISOString() });
}

export async function deleteExerciseType(code: string): Promise<number> {
  return db<ExerciseTypeRow>("exercise_types")
    .where({ code })
    .update({ is_active: false, updated_at: new Date().toISOString() });
}

export async function restoreExerciseType(code: string): Promise<number> {
  return db<ExerciseTypeRow>("exercise_types")
    .where({ code })
    .update({ is_active: true, updated_at: new Date().toISOString() });
}

type TranslatedExerciseTypeRow = {
  code: string;
  name: string;
  description: string;
};

export async function getTranslatedExerciseTypes(locale: string): Promise<ExerciseType[]> {
  const rows = await db("exercise_types as t")
    .leftJoin("translations as tr", function () {
      this.on("tr.key", "=", db.raw("concat('exercise_type.', t.code, '.name')")).andOn(
        "tr.locale",
        "=",
        db.raw("?", [locale]),
      );
    })
    .where({ "t.is_active": true })
    .orderBy("name")
    .select<TranslatedExerciseTypeRow[]>([
      "t.code as code",
      db.raw("COALESCE(tr.value, t.name) as name"),
      "t.description as description",
    ]);

  return rows.map(({ code, name, description }) => ({ code, name, description }));
}
