import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('plans').del();
  const user = await knex('users').first();
  if (!user) return;
  const now = new Date().toISOString();
  await knex('plans').insert([
    { id: uuidv4(), user_id: user.id, title: '12 Week Strength Plan', starts_on: '2025-10-01', ends_on: '2025-12-24', created_at: now, updated_at: now }
  ]);
}
