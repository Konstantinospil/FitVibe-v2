import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('exercises').del();
  const now = new Date().toISOString();
  await knex('exercises').insert([
    { id: uuidv4(), name: 'Back Squat', type_code: 'strength', default_metrics: { unit: 'kg' }, created_at: now, updated_at: now },
    { id: uuidv4(), name: 'Bench Press', type_code: 'strength', default_metrics: { unit: 'kg' }, created_at: now, updated_at: now },
    { id: uuidv4(), name: 'Running', type_code: 'cardio', default_metrics: { unit: 'm,sec' }, created_at: now, updated_at: now },
    { id: uuidv4(), name: 'Cycling', type_code: 'cardio', default_metrics: { unit: 'm,sec' }, created_at: now, updated_at: now }
  ]);
}
