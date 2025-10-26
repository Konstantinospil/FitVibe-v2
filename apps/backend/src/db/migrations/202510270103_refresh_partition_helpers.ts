import type { Knex } from "knex";
import fs from "node:fs";
import path from "node:path";

function readSql(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");
}

export async function up(knex: Knex): Promise<void> {
  await knex.raw(readSql("../functions/ensure_partitions.sql"));
  await knex.raw("SELECT public.ensure_monthly_partitions();");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("SELECT public.ensure_monthly_partitions();");
}
