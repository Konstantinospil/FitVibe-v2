import type { Knex } from "knex";

const PRIMARY_CONTACT_INDEX = "user_contacts_primary_unique";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_contacts", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.string("type").notNullable();
    table.string("value").notNullable().unique();
    table.boolean("is_primary").notNullable().defaultTo(false);
    table.boolean("is_recovery").notNullable().defaultTo(false);
    table.boolean("is_verified").notNullable().defaultTo(false);
    table.timestamp("verified_at", { useTz: true }).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(["user_id"], "user_contacts_user_id_idx");
  });

  await knex.raw(
    `CREATE UNIQUE INDEX ${PRIMARY_CONTACT_INDEX} ON user_contacts(user_id) WHERE is_primary IS TRUE;`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${PRIMARY_CONTACT_INDEX};`);
  await knex.schema.dropTableIfExists("user_contacts");
}
