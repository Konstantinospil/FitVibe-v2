import type { Knex } from "knex";

const TABLE = "share_links";
const SHARE_LINK_TOKEN_UNIQUE = "share_links_token_unique";
const SHARE_LINK_SESSION_INDEX = "share_links_session_idx";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE, (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("session_id")
      .notNullable()
      .references("id")
      .inTable("sessions")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.string("token").notNullable().unique(SHARE_LINK_TOKEN_UNIQUE);
    table.integer("view_count").notNullable().defaultTo(0);
    table.integer("max_views").nullable();
    table.timestamp("expires_at", { useTz: true }).nullable();
    table.timestamp("revoked_at", { useTz: true }).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.uuid("created_by").notNullable().references("id").inTable("users").onDelete("CASCADE");
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.index(["session_id"], SHARE_LINK_SESSION_INDEX);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE, (table) => {
    table.dropIndex(["session_id"], SHARE_LINK_SESSION_INDEX);
  });
  await knex.schema.dropTableIfExists(TABLE);
}
