import { Knex } from "knex";

const now = new Date();

const PLANNED = [
  {
    id: "eeeeeee1-eeee-eeee-eeee-eeeeeeeeeeee",
    session_exercise_id: "bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    sets: 5,
    reps: 3,
    load: 120,
    distance: null,
    duration: null,
    rpe: 8,
    rest: "00:03:00",
    extras: { tempo: "31X1" },
    created_at: now,
  },
  {
    id: "fffffff1-ffff-ffff-ffff-ffffffffffff",
    session_exercise_id: "ccccccc1-cccc-cccc-cccc-cccccccccccc",
    sets: 3,
    reps: 6,
    load: 90,
    distance: null,
    duration: null,
    rpe: 7,
    rest: "00:02:30",
    extras: {},
    created_at: now,
  },
  {
    id: "11111111-aaaa-bbbb-cccc-222222222222",
    session_exercise_id: "ddddddd1-dddd-dddd-dddd-dddddddddddd",
    sets: null,
    reps: null,
    load: null,
    distance: 5,
    duration: "00:40:00",
    rpe: 7,
    rest: null,
    extras: { pace: "4:00/km" },
    created_at: now,
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("planned_exercise_attributes")
    .insert(PLANNED)
    .onConflict("session_exercise_id")
    .merge();
}
