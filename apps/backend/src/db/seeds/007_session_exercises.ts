import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('session_exercises').del();
  const session = await knex('sessions').first();
  const exercise = await knex('exercises').first();
  if (!session || !exercise) return;
  await knex('session_exercises').insert([
    { id: uuidv4(), session_id: session.id, exercise_id: exercise.id, ord: 1, target_sets: 5, target_reps: 5 }
  ]);
}
