import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('feed_posts').del();
  const user = await knex('users').first();
  if (!user) return;
  const now = new Date().toISOString();
  await knex('feed_posts').insert([
    { id: uuidv4(), author_id: user.id, content: 'Just crushed my lower body session!', visibility: 'public', created_at: now, updated_at: now }
  ]);
}
