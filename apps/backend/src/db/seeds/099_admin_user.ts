import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import argon2 from 'argon2';

export async function seed(knex: Knex): Promise<void> {
  const email = 'admin@example.com';
  const existing = await knex('users').where({ email }).first();
  if (existing) return;

  const id = uuidv4();
  const password_hash = await argon2.hash('Admin123!');
  await knex('users').insert({
    id,
    email,
    username: 'admin',
    password_hash,
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}
