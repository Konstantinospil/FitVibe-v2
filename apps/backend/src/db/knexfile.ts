import type { Knex } from 'knex';
import dotenv from 'dotenv';
dotenv.config();

const shared: Partial<Knex.Config> = {
  client: 'pg',
  pool: { min: 2, max: 10 },
  migrations: { tableName: 'knex_migrations', extension: 'ts', directory: './src/db/migrations' },
  seeds: { extension: 'ts', directory: './src/db/seeds' }
};

const config: { [key: string]: Knex.Config } = {
  development: {
    ...shared,
    connection: {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'fitvibe',
      user: process.env.PGUSER || 'fitvibe',
      password: process.env.PGPASSWORD || 'fitvibe'
    }
  },
  test: {
    ...shared,
    connection: {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'fitvibe_test',
      user: process.env.PGUSER || 'fitvibe',
      password: process.env.PGPASSWORD || 'fitvibe'
    }
  },
  production: {
    ...shared,
    connection: {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
    }
  }
};

export default config;
