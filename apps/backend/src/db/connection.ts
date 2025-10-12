import knex, { Knex } from 'knex';
import { DB_CONFIG } from './db.config.js';

export const db: Knex = knex({
  client: 'pg',
  connection: DB_CONFIG,
  pool: { min: 2, max: 10 },
  migrations: { tableName: 'knex_migrations' }
});

export async function testConnection() {
  try {
    await db.raw('SELECT 1+1 AS result');
    console.log('v Database connection successful');
  } catch (err) {
    console.error('x Database connection failed:', err);
    process.exit(1);
  }
}
