import { Knex } from "knex";

const now = new Date();

const ACTUAL = [
  {
    id: "22222222-bbbb-cccc-dddd-333333333333",
    session_exercise_id: "bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    sets: 5,
    reps: 3,
    load: 122.5,
    distance: null,
    duration: null,
    rpe: 8,
    rest: "00:03:00",
    extras: { notes: "Felt strong." },
    recorded_at: now,
  },
  {
    id: "33333333-cccc-dddd-eeee-444444444444",
    session_exercise_id: "ddddddd1-dddd-dddd-dddd-dddddddddddd",
    sets: null,
    reps: null,
    load: null,
    distance: 5.1,
    duration: "00:38:45",
    rpe: 7,
    rest: null,
    extras: { avg_hr: 162 },
    recorded_at: now,
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("actual_exercise_attributes")
    .insert(ACTUAL)
    .onConflict("session_exercise_id")
    .merge();
}
