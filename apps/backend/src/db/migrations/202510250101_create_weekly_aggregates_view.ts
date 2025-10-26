import type { Knex } from "knex";

const VIEW_NAME = "weekly_aggregates";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE MATERIALIZED VIEW ${VIEW_NAME} AS
    SELECT
      ss.owner_id,
      date_trunc('week', ss.completed_at) AS week_start,
      COUNT(*)::int AS sessions,
      COALESCE(SUM(ss.total_volume), 0)::numeric AS total_volume,
      COALESCE(SUM(ss.total_duration_sec), 0)::numeric AS total_duration_sec,
      NOW() AS refreshed_at
    FROM session_summary ss
    WHERE ss.completed_at IS NOT NULL
    GROUP BY ss.owner_id, date_trunc('week', ss.completed_at)
    WITH NO DATA;
  `);

  await knex.raw(
    `CREATE INDEX IF NOT EXISTS idx_${VIEW_NAME}_owner_week ON ${VIEW_NAME} (owner_id, week_start DESC);`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP MATERIALIZED VIEW IF EXISTS ${VIEW_NAME};`);
}

