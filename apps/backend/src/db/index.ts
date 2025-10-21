import type { Knex } from "knex";
import knex from "knex";
import config from "./knexfile.js";
import { db as connectionDb } from "./connection.js";

const env = process.env.NODE_ENV ?? "development";
const configurations = config as Record<string, Knex.Config>;

export const db: Knex = configurations[env] ? knex(configurations[env]) : connectionDb;

export * from "./connection.js";
export default db;
