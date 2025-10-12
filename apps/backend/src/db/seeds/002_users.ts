import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';
import argon2 from 'argon2';

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del();
  const now = new Date().toISOString();
  const password_hash = await argon2.hash('Passw0rd!');
  await knex('users').insert([
    { id: uuidv4(), username: 'demo', email: 'demo@example.com', password_hash, role: 'user', status: 'active', created_at: now, updated_at: now },
    { id: uuidv4(), username: 'coach', email: 'coach@example.com', password_hash, role: 'user', status: 'active', created_at: now, updated_at: now }
  ]);
}
