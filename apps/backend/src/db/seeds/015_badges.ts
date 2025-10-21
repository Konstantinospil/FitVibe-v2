import type { Knex } from "knex";

const BADGES = [
  {
    id: "55555555-6666-7777-8888-999999999999",
    user_id: "22222222-2222-2222-2222-222222222222",
    badge_type: "week_streak_3",
    awarded_at: new Date(),
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("badges").insert(BADGES).onConflict("id").ignore();
}
