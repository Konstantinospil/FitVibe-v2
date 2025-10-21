import type { Knex } from "knex";

const EXERCISE_TYPES = [
  { code: "strength", description: "Strength & resistance training" },
  { code: "cardio", description: "Cardiovascular / endurance work" },
  { code: "mobility", description: "Mobility and flexibility drills" },
  { code: "skill", description: "Skill technique or sport-specific drills" },
  { code: "recovery", description: "Recovery and regeneration sessions" },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("exercise_types").insert(EXERCISE_TYPES).onConflict("code").ignore();
}
