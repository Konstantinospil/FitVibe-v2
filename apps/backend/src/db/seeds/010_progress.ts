import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('progress').del();
  const user = await knex('users').first();
  const ex = await knex('exercises').first();
  if (!user || !ex) return;
  const now = new Date().toISOString();
  await knex('progress').insert([
    { id: uuidv4(), user_id: user.id, exercise_id: ex.id, metric: '1RM', value: 120, unit: 'kg', measured_at: now }
  ]);
}
