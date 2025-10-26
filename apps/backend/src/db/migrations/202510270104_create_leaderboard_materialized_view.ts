import type { Knex } from "knex";
import fs from "node:fs";
import path from "node:path";

const UNIQUE_INDEX = "mv_leaderboard_unique_idx";
const SORT_INDEX = "mv_leaderboard_sort_idx";

function readSql(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");
}

export async function up(knex: Knex): Promise<void> {
  await knex.raw("DROP MATERIALIZED VIEW IF EXISTS mv_leaderboard CASCADE;");
  await knex.raw(readSql("../views/mv_leaderboard.sql"));
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS ${UNIQUE_INDEX}
    ON mv_leaderboard (period_type, period_start, user_id)
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${SORT_INDEX}
    ON mv_leaderboard (period_type, period_start DESC, points DESC)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${SORT_INDEX};`);
  await knex.raw(`DROP INDEX IF EXISTS ${UNIQUE_INDEX};`);
  await knex.raw("DROP MATERIALIZED VIEW IF EXISTS mv_leaderboard;");
}
