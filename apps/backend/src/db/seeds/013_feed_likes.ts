import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('feed_likes').del();
  const post = await knex('feed_posts').first();
  const user = await knex('users').first();
  if (!post || !user) return;
  const now = new Date().toISOString();
  await knex('feed_likes').insert([
    { id: uuidv4(), post_id: post.id, user_id: user.id, created_at: now }
  ]);
}
