import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('audit_log').del();
  const user = await knex('users').first();
  if (!user) return;
  const now = new Date().toISOString();
  await knex('audit_log').insert([
    { id: uuidv4(), actor_user_id: user.id, action: 'seed_insert', entity: 'all', entity_id: null, metadata: { batch: 'init' }, created_at: now }
  ]);
}
