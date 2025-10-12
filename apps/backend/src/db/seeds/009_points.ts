import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('points').del();
  const user = await knex('users').first();
  if (!user) return;
  const now = new Date().toISOString();
  await knex('points').insert([
    { id: uuidv4(), user_id: user.id, delta: 10, reason: 'workout_completed', created_at: now }
  ]);
}
