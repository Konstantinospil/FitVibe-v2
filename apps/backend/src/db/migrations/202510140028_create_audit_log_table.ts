import { Knex } from "knex";

const AUDIT_TABLE = "audit_log";
const AUDIT_ACTOR_INDEX = "audit_log_actor_created_idx";
const AUDIT_ENTITY_INDEX = "audit_log_entity_created_idx";

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(AUDIT_TABLE);
  if (!hasTable) {
    await knex.schema.createTable(AUDIT_TABLE, (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table
        .uuid("actor_user_id")
        .nullable()
        .references("id")
        .inTable("users")
        .onUpdate("CASCADE")
        .onDelete("SET NULL");
      table.string("entity").notNullable();
      table.string("action").notNullable();
      table.uuid("entity_id").nullable();
      table.jsonb("metadata").nullable();
      table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.alterTable(AUDIT_TABLE, (table) => {
      table.index(["actor_user_id", "created_at"], AUDIT_ACTOR_INDEX);
      table.index(["entity", "created_at"], AUDIT_ENTITY_INDEX);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(AUDIT_TABLE);
  if (hasTable) {
    await knex.schema.alterTable(AUDIT_TABLE, (table) => {
      table.dropIndex(["actor_user_id", "created_at"], AUDIT_ACTOR_INDEX);
      table.dropIndex(["entity", "created_at"], AUDIT_ENTITY_INDEX);
    });
    await knex.schema.dropTable(AUDIT_TABLE);
  }
}
