import type { Knex } from "knex";
import knex from "knex";

import { DB_CONFIG } from "./db.config.js";
import { logger } from "../config/logger.js";

export const db: Knex = knex({
  client: "pg",
  connection: DB_CONFIG,
  pool: { min: 2, max: 10 },
  migrations: { tableName: "knex_migrations" },
});

export async function testConnection(): Promise<void> {
  try {
    await db.raw("SELECT 1 + 1 AS result");
    logger.info("Database connection successful");
  } catch (error) {
    logger.error({ err: error }, "Database connection failed");
    process.exit(1);
  }
}
