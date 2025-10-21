import type { Knex } from "knex";

const TABLE = "idempotency_keys";
const IDX_UNIQUE = "idx_idempotency_unique";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE, (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("method", 16).notNullable();
    table.string("route", 255).notNullable();
    table.string("key", 255).notNullable();
    table.string("request_hash", 128).notNullable();
    table.integer("response_status");
    table.jsonb("response_body");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.unique(["user_id", "method", "route", "key"], IDX_UNIQUE);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE);
}
