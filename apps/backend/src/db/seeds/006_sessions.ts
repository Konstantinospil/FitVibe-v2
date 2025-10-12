import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('sessions').del();
  const user = await knex('users').first();
  const plan = await knex('plans').first();
  const now = new Date().toISOString();
  if (!user) return;
  await knex('sessions').insert([
    { id: uuidv4(), user_id: user.id, plan_id: plan?.id || null, title: 'Lower Body Day', status: 'planned', planned_at: now, created_at: now, updated_at: now }
  ]);
}
