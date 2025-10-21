import type { Knex } from "knex";

const MEDIA_TARGET_INDEX = "media_target_type_id_idx";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("media", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("owner_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.string("target_type").notNullable();
    table.uuid("target_id").notNullable();
    table.string("storage_key").notNullable();
    table.string("file_url").notNullable();
    table.string("mime_type").nullable();
    table.string("media_type").nullable();
    table.integer("bytes").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("media", (table) => {
    table.index(["target_type", "target_id"], MEDIA_TARGET_INDEX);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("media", (table) => {
    table.dropIndex(["target_type", "target_id"], MEDIA_TARGET_INDEX);
  });
  await knex.schema.dropTableIfExists("media");
}
