import type { Knex } from "knex";

const AUDIT_TABLE = "audit_log";
const OLD_ACTOR_INDEX = "audit_log_actor_created_idx";
const OLD_ENTITY_INDEX = "audit_log_entity_created_idx";
const NEW_ACTOR_INDEX = "idx_audit_log_actor_recent";
const NEW_ENTITY_INDEX = "idx_audit_log_entity_recent";

async function dropLegacyIndexes(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${OLD_ACTOR_INDEX}`);
  await knex.raw(`DROP INDEX IF EXISTS ${OLD_ENTITY_INDEX}`);
}

async function createNewIndexes(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${NEW_ACTOR_INDEX}
    ON ${AUDIT_TABLE} (actor_user_id, created_at DESC)
    WHERE actor_user_id IS NOT NULL
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${NEW_ENTITY_INDEX}
    ON ${AUDIT_TABLE} (entity_type, entity_id, created_at DESC)
  `);
}

async function renameEntityColumn(knex: Knex): Promise<void> {
  const hasEntity = await knex.schema.hasColumn(AUDIT_TABLE, "entity");
  const hasEntityType = await knex.schema.hasColumn(AUDIT_TABLE, "entity_type");

  if (hasEntity && !hasEntityType) {
    await knex.schema.alterTable(AUDIT_TABLE, (table) => {
      table.renameColumn("entity", "entity_type");
    });
  }
}

async function addNewColumns(knex: Knex): Promise<void> {
  const hasOutcome = await knex.schema.hasColumn(AUDIT_TABLE, "outcome");
  const hasRequestId = await knex.schema.hasColumn(AUDIT_TABLE, "request_id");

  await knex.schema.alterTable(AUDIT_TABLE, (table) => {
    if (!hasOutcome) {
      table.string("outcome").notNullable().defaultTo("success");
    }
    if (!hasRequestId) {
      table.uuid("request_id").nullable();
    }
  });
}

async function removeNewColumns(knex: Knex): Promise<void> {
  const hasOutcome = await knex.schema.hasColumn(AUDIT_TABLE, "outcome");
  const hasRequestId = await knex.schema.hasColumn(AUDIT_TABLE, "request_id");

  await knex.schema.alterTable(AUDIT_TABLE, (table) => {
    if (hasOutcome) {
      table.dropColumn("outcome");
    }
    if (hasRequestId) {
      table.dropColumn("request_id");
    }
  });
}

export async function up(knex: Knex): Promise<void> {
  await dropLegacyIndexes(knex);
  await renameEntityColumn(knex);
  await addNewColumns(knex);
  await createNewIndexes(knex);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${NEW_ENTITY_INDEX}`);
  await knex.raw(`DROP INDEX IF EXISTS ${NEW_ACTOR_INDEX}`);

  await removeNewColumns(knex);

  const hasEntityType = await knex.schema.hasColumn(AUDIT_TABLE, "entity_type");
  const hasEntity = await knex.schema.hasColumn(AUDIT_TABLE, "entity");

  if (hasEntityType && !hasEntity) {
    await knex.schema.alterTable(AUDIT_TABLE, (table) => {
      table.renameColumn("entity_type", "entity");
    });
  }

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${OLD_ACTOR_INDEX}
    ON ${AUDIT_TABLE} (actor_user_id, created_at)
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${OLD_ENTITY_INDEX}
    ON ${AUDIT_TABLE} (entity, created_at)
  `);
}
