import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('notifications').del();
  const user = await knex('users').first();
  if (!user) return;
  const now = new Date().toISOString();
  await knex('notifications').insert([
    { id: uuidv4(), user_id: user.id, type: 'like', payload: { message: 'Someone liked your post' }, read: false, created_at: now }
  ]);
}
