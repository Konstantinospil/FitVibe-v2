import type { Knex } from "knex";

const now = new Date();

const METRICS = [
  {
    id: "66666666-6666-6666-6666-666666666666",
    user_id: "22222222-2222-2222-2222-222222222222",
    weight: 62.5,
    unit: "kg",
    fitness_level_code: "intermediate",
    training_frequency: "4x_week",
    photo_url: null,
    recorded_at: now,
    created_at: now,
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("user_metrics").insert(METRICS).onConflict("id").ignore();
}
