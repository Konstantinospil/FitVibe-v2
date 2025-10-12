import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('roles').del();
  await knex('roles').insert([
    { code: 'user', name: 'User', description: 'Standard registered user' },
    { code: 'admin', name: 'Administrator', description: 'Full administrative privileges' }
  ]);
}
