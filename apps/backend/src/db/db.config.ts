import dotenv from 'dotenv';
dotenv.config();

export const DB_CONFIG = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'fitvibe',
  user: process.env.PGUSER || 'fitvibe',
  password: process.env.PGPASSWORD || 'fitvibe',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
};
