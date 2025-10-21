import type { Knex } from "knex";

const SESSION_EXERCISES = [
  {
    id: "bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    session_id: "99999999-9999-9999-9999-999999999999",
    exercise_id: "77777777-7777-7777-7777-777777777777",
    order_index: 1,
    notes: "Work up to heavy triple.",
    created_at: new Date(),
  },
  {
    id: "ccccccc1-cccc-cccc-cccc-cccccccccccc",
    session_id: "99999999-9999-9999-9999-999999999999",
    exercise_id: "77777777-7777-7777-7777-777777777777",
    order_index: 2,
    notes: "Back-off sets at 70%.",
    created_at: new Date(),
  },
  {
    id: "ddddddd1-dddd-dddd-dddd-dddddddddddd",
    session_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    exercise_id: "88888888-8888-8888-8888-888888888888",
    order_index: 1,
    notes: "Maintain threshold pace.",
    created_at: new Date(),
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("session_exercises").insert(SESSION_EXERCISES).onConflict("id").ignore();
}
