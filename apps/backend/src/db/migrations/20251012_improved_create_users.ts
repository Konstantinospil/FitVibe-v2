import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.dropUnique(['username']);
    t.dropUnique(['email']);
  });
  
  await knex.raw(`
    CREATE UNIQUE INDEX idx_users_username_lower 
    ON users(LOWER(username));
    
    CREATE UNIQUE INDEX idx_users_email_lower 
    ON users(LOWER(email));
    
    CREATE INDEX idx_users_role_status 
    ON users(role, status);
  `);
}