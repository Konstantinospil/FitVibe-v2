import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('metrics_snapshots').del();
  const now = new Date().toISOString();
  await knex('metrics_snapshots').insert([
    { id: uuidv4(), metric: 'daily_active_users', value: 100, captured_at: now, dimensions: { region: 'eu' } },
    { id: uuidv4(), metric: 'completed_sessions', value: 45, captured_at: now, dimensions: { region: 'eu' } }
  ]);
}
