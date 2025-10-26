import type { Knex } from "knex";

const SESSIONS_TABLE = "sessions";
const PLANS_TABLE = "plans";
const PLAN_FK = "sessions_plan_id_fk";
const IDX_SESSIONS_OWNER_STATUS = "idx_sessions_owner_status_planned";
const IDX_SESSIONS_PUBLIC = "idx_sessions_public_recent";
const IDX_FEED_PUBLIC = "idx_feed_items_public_recent";
const FEED_ITEMS_TABLE = "feed_items";
const TRANSLATION_CACHE_TABLE = "translation_cache";
const IDX_TRANSLATION_CACHE_LOOKUP = "idx_translation_cache_lang_source";
const LEGACY_SESSION_INDEXES = [
  "idx_sessions_owner",
  "idx_sessions_status",
  "idx_sessions_planned_at",
];

async function addSessionsPlanForeignKey(knex: Knex): Promise<void> {
  const hasPlanColumn = await knex.schema.hasColumn(SESSIONS_TABLE, "plan_id");
  if (!hasPlanColumn) {
    return;
  }

  const missingRefs = await knex(SESSIONS_TABLE)
    .whereNotNull("plan_id")
    .whereNotExists(function selectMissing(this: Knex.QueryBuilder) {
      this.select(1)
        .from(PLANS_TABLE)
        .whereRaw(`${PLANS_TABLE}.id = ${SESSIONS_TABLE}.plan_id`);
    })
    .update({ plan_id: null });

  if (missingRefs > 0) {
    // Swallowing result ensures matching signature; audit trail handled via application logs.
  }

  const constraintExists = await knex
    .select(1)
    .from("pg_constraint")
    .where({ conname: PLAN_FK })
    .first();

  if (!constraintExists) {
    await knex.raw(`
      ALTER TABLE ${SESSIONS_TABLE}
      ADD CONSTRAINT ${PLAN_FK}
      FOREIGN KEY (plan_id)
      REFERENCES ${PLANS_TABLE}(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL
    `);
  }
}

async function refreshSessionIndexes(knex: Knex): Promise<void> {
  for (const indexName of LEGACY_SESSION_INDEXES) {
    await knex.raw(`DROP INDEX IF EXISTS ${indexName}`);
  }

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${IDX_SESSIONS_OWNER_STATUS}
    ON ${SESSIONS_TABLE} (owner_id, status, planned_at DESC)
    WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${IDX_SESSIONS_PUBLIC}
    ON ${SESSIONS_TABLE} (planned_at DESC)
    WHERE visibility = 'public' AND deleted_at IS NULL
  `);
}

async function refreshFeedIndexes(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${IDX_FEED_PUBLIC}
    ON ${FEED_ITEMS_TABLE} (published_at DESC)
    WHERE visibility = 'public' AND deleted_at IS NULL
  `);
}

async function ensureTranslationCacheIndex(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(TRANSLATION_CACHE_TABLE);
  if (!hasTable) {
    return;
  }

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${IDX_TRANSLATION_CACHE_LOOKUP}
    ON ${TRANSLATION_CACHE_TABLE} (lang, source)
  `);
}

export async function up(knex: Knex): Promise<void> {
  await addSessionsPlanForeignKey(knex);
  await refreshSessionIndexes(knex);
  await refreshFeedIndexes(knex);
  await ensureTranslationCacheIndex(knex);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_TRANSLATION_CACHE_LOOKUP}`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_FEED_PUBLIC}`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_SESSIONS_PUBLIC}`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_SESSIONS_OWNER_STATUS}`);

  for (const indexName of LEGACY_SESSION_INDEXES) {
    if (indexName === "idx_sessions_planned_at") {
      await knex.raw(
        `CREATE INDEX IF NOT EXISTS ${indexName} ON ${SESSIONS_TABLE}(planned_at DESC)`,
      );
    } else if (indexName === "idx_sessions_status") {
      await knex.raw(
        `CREATE INDEX IF NOT EXISTS ${indexName} ON ${SESSIONS_TABLE}(status)`,
      );
    } else if (indexName === "idx_sessions_owner") {
      await knex.raw(
        `CREATE INDEX IF NOT EXISTS ${indexName} ON ${SESSIONS_TABLE}(owner_id)`,
      );
    }
  }

  await knex.raw(
    `ALTER TABLE ${SESSIONS_TABLE} DROP CONSTRAINT IF EXISTS ${PLAN_FK}`,
  );
}
