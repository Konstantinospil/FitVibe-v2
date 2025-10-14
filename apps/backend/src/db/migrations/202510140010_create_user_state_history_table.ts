import { Knex } from "knex";

const USER_STATE_INDEX = "user_state_history_user_id_changed_at_idx";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS user_state_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      field text NOT NULL,
      old_value jsonb,
      new_value jsonb,
      changed_at timestamptz NOT NULL DEFAULT now()
    ) PARTITION BY RANGE (changed_at);
  `);

  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${USER_STATE_INDEX} ON user_state_history(user_id, changed_at);`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${USER_STATE_INDEX};`);
  await knex.raw("DROP TABLE IF EXISTS user_state_history CASCADE;");
}
