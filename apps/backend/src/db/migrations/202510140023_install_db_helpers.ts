import type { Knex } from "knex";
import fs from "node:fs";
import path from "node:path";

function readSql(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");
}

export async function up(knex: Knex): Promise<void> {
  await knex.raw(readSql("../types/exercise_difficulty_enum.sql"));
  await knex.raw(readSql("../functions/ensure_partitions.sql"));
  await knex.raw(readSql("../functions/refresh_session_summary.sql"));
  await knex.raw("DROP VIEW IF EXISTS v_session_summary;");
  await knex.raw(readSql("../views/v_session_summary.sql"));
  await knex.raw(readSql("../triggers/t_session_summary_refresh.sql"));
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TRIGGER IF EXISTS trg_session_summary_refresh ON sessions;");
  await knex.raw("DROP FUNCTION IF EXISTS session_summary_refresh_trigger();");
  await knex.raw("DROP VIEW IF EXISTS v_session_summary;");
  await knex.raw("DROP FUNCTION IF EXISTS refresh_session_summary(boolean);");
  await knex.raw("DROP FUNCTION IF EXISTS ensure_monthly_partitions();");
  await knex.raw("DROP TYPE IF EXISTS exercise_difficulty_enum;");
}
