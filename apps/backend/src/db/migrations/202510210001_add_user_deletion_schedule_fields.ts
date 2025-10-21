import type { Knex } from "knex";

const USERS_TABLE = "users";
const TOMBSTONES_TABLE = "user_tombstones";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(USERS_TABLE, (table) => {
    table.timestamp("purge_scheduled_at", { useTz: true }).nullable();
    table.timestamp("backup_purge_due_at", { useTz: true }).nullable();
  });

  await knex.schema.createTable(TOMBSTONES_TABLE, (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable();
    table.string("username").nullable();
    table.string("email").nullable();
    table.timestamp("deleted_at", { useTz: true }).notNullable();
    table.timestamp("purged_at", { useTz: true }).notNullable();
    table.timestamp("backup_purge_due_at", { useTz: true }).notNullable();
    table.jsonb("metadata").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(["user_id"], "user_tombstones_user_id_idx");
    table.index(["backup_purge_due_at"], "user_tombstones_backup_due_idx");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TOMBSTONES_TABLE);

  await knex.schema.alterTable(USERS_TABLE, (table) => {
    table.dropColumn("purge_scheduled_at");
    table.dropColumn("backup_purge_due_at");
  });
}
