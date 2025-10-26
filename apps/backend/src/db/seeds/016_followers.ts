import type { Knex } from "knex";

const FOLLOWERS = [
  {
    follower_id: "11111111-1111-1111-1111-111111111111",
    following_id: "22222222-2222-2222-2222-222222222222",
    created_at: new Date("2025-10-12T08:00:00Z"),
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("followers")
    .insert(FOLLOWERS)
    .onConflict(["follower_id", "following_id"])
    .ignore();
}
