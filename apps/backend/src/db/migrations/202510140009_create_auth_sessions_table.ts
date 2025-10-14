import { Knex } from "knex";

const AUTH_SESSION_INDEX = "auth_sessions_user_id_expires_idx";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("auth_sessions", (table) => {
    table.uuid("jti").primary();
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.string("user_agent").nullable();
    table.specificType("ip", "inet").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("expires_at", { useTz: true }).notNullable();
    table.timestamp("revoked_at", { useTz: true }).nullable();
  });

  await knex.schema.alterTable("auth_sessions", (table) => {
    table.index(["user_id", "expires_at"], AUTH_SESSION_INDEX);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("auth_sessions", (table) => {
    table.dropIndex(["user_id", "expires_at"], AUTH_SESSION_INDEX);
  });
  await knex.schema.dropTableIfExists("auth_sessions");
}
