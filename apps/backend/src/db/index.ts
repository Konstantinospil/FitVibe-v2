import knex, { Knex } from 'knex';
import config from './knexfile.js';
import { db as staticDb } from './connection.js';

const env = process.env.NODE_ENV || 'development';
export const db: Knex = (config as any)[env]
  ? knex((config as any)[env])
  : staticDb;

export * from './connection.js';
export default db;
