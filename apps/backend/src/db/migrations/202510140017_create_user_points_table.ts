import type { Knex } from "knex";

const USER_POINTS_INDEX = "user_points_user_id_awarded_at_idx";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS user_points (
      id uuid DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      source_type text NOT NULL,
      algorithm_version text,
      points integer NOT NULL,
      awarded_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (id, awarded_at)
    ) PARTITION BY RANGE (awarded_at);
  `);

  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${USER_POINTS_INDEX} ON user_points(user_id, awarded_at DESC);`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${USER_POINTS_INDEX};`);
  await knex.raw("DROP TABLE IF EXISTS user_points CASCADE;");
}
