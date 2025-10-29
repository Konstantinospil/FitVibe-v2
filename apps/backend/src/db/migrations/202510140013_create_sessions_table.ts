import type { Knex } from "knex";

const SESSIONS_TABLE = "sessions";
const IDX_OWNER = "idx_sessions_owner";
const IDX_STATUS = "idx_sessions_status";
const IDX_PLANNED_AT = "idx_sessions_planned_at";
const IDX_ACTIVE = "idx_sessions_owner_active";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS ${SESSIONS_TABLE} (
      id uuid DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      title text,
      plan_id uuid,
      planned_at timestamptz NOT NULL,
      started_at timestamptz,
      completed_at timestamptz,
      status text NOT NULL DEFAULT 'planned',
      visibility text NOT NULL DEFAULT 'private',
      recurrence_rule text,
      notes text,
      calories integer,
      points integer,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz,
      PRIMARY KEY (id, planned_at)
    ) PARTITION BY RANGE (planned_at);
  `);

  await knex.raw(`CREATE INDEX IF NOT EXISTS ${IDX_OWNER} ON ${SESSIONS_TABLE}(owner_id);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS ${IDX_STATUS} ON ${SESSIONS_TABLE}(status);`);
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${IDX_PLANNED_AT} ON ${SESSIONS_TABLE}(planned_at DESC);`,
  );
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${IDX_ACTIVE} ON ${SESSIONS_TABLE}(owner_id) WHERE deleted_at IS NULL;`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_ACTIVE};`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_PLANNED_AT};`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_STATUS};`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_OWNER};`);
  await knex.raw(`DROP TABLE IF EXISTS ${SESSIONS_TABLE} CASCADE;`);
}
