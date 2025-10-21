import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.specificType("username", "citext").notNullable().unique();
    table.string("display_name").notNullable();
    table.string("locale").notNullable().defaultTo("en-US");
    table.string("preferred_lang").notNullable().defaultTo("en");
    table.string("status").notNullable().defaultTo("active");
    table
      .string("role_code")
      .notNullable()
      .references("code")
      .inTable("roles")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");
    table.string("password_hash").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at", { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
