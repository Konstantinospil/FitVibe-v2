import knex, { Knex } from "knex";
import { DB_CONFIG } from "./db.config.js";

export const db: Knex = knex({
  client: "pg",
  connection: DB_CONFIG,
  pool: { min: 2, max: 10 },
  migrations: { tableName: "knex_migrations" },
});

export async function testConnection(): Promise<void> {
  try {
    await db.raw("SELECT 1 + 1 AS result");
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
}
