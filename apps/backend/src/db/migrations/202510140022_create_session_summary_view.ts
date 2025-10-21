import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE MATERIALIZED VIEW session_summary AS
    SELECT
      s.id AS session_id,
      s.owner_id,
      COUNT(se.id)::int AS exercise_count,
      COALESCE(SUM(
        COALESCE(es.reps, 0) * COALESCE(es.weight_kg, 0)
      ), 0)::numeric AS total_volume,
      s.status,
      s.planned_at,
      s.completed_at,
      NOW() AS refreshed_at
    FROM sessions s
    LEFT JOIN session_exercises se ON se.session_id = s.id
    LEFT JOIN exercise_sets es ON es.session_exercise_id = se.id
    GROUP BY s.id, s.owner_id, s.status, s.planned_at, s.completed_at
    WITH NO DATA;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP MATERIALIZED VIEW IF EXISTS session_summary;");
}
