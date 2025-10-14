import { Knex } from "knex";

const EXERCISE_SETS = [
  {
    id: "eeeeeee1-eeee-eeee-eeee-eeeeeeeeeeee",
    session_exercise_id: "bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    order_index: 1,
    reps: 3,
    weight_kg: 150,
    duration_sec: null,
    distance_m: null,
    rpe: 9,
    notes: "Top set",
    created_at: new Date(),
  },
  {
    id: "fffffff1-ffff-ffff-ffff-ffffffffffff",
    session_exercise_id: "bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    order_index: 2,
    reps: 5,
    weight_kg: 120,
    duration_sec: null,
    distance_m: null,
    rpe: 7,
    notes: "Back-off",
    created_at: new Date(),
  },
  {
    id: "11111111-aaaa-bbbb-cccc-222222222222",
    session_exercise_id: "ddddddd1-dddd-dddd-dddd-dddddddddddd",
    order_index: 1,
    reps: null,
    weight_kg: null,
    duration_sec: 1800,
    distance_m: 8000,
    rpe: 6,
    notes: "Steady tempo",
    created_at: new Date(),
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("exercise_sets").insert(EXERCISE_SETS).onConflict("id").ignore();
}
