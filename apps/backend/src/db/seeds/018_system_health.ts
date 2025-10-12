import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('system_health').del();
  const now = new Date().toISOString();
  await knex('system_health').insert([
    { id: uuidv4(), service: 'api', status: 'ok', details: 'API running', checked_at: now },
    { id: uuidv4(), service: 'db', status: 'ok', details: 'Database connected', checked_at: now }
  ]);
}
