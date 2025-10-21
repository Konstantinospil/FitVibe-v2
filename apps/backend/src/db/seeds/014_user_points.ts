import type { Knex } from "knex";

const now = new Date();

const USER_POINTS = [
  {
    id: "44444444-5555-6666-7777-888888888888",
    user_id: "22222222-2222-2222-2222-222222222222",
    source_type: "session_completed",
    algorithm_version: "v1",
    points: 30,
    awarded_at: now,
  },
  {
    id: "99999999-aaaa-bbbb-cccc-dddddddddddd",
    user_id: "22222222-2222-2222-2222-222222222222",
    source_type: "streak_bonus",
    algorithm_version: "v1",
    points: 15,
    awarded_at: new Date(now.getTime() + 1000 * 60 * 60 * 6),
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("user_points").insert(USER_POINTS).onConflict("id").ignore();
}
