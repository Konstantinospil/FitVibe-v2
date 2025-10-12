import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('exercise_sets').del();
  const sess = await knex('sessions').first();
  const se = await knex('session_exercises').first();
  if (!sess || !se) return;
  await knex('exercise_sets').insert([
    { id: uuidv4(), session_id: sess.id, session_exercise_id: se.id, set_no: 1, reps: 5, load_kg: 100 },
    { id: uuidv4(), session_id: sess.id, session_exercise_id: se.id, set_no: 2, reps: 5, load_kg: 105 }
  ]);
}
