import type { Knex } from "knex";

const TRANSLATION_CACHE_HASH_UNIQUE = "translation_cache_hash_unique";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("translation_cache", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.text("source").notNullable();
    table.string("lang").notNullable();
    table.text("translated").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(
    "ALTER TABLE translation_cache ADD COLUMN hash uuid GENERATED ALWAYS AS ((md5(source || lang))::uuid) STORED;",
  );
  await knex.raw(
    `ALTER TABLE translation_cache ADD CONSTRAINT ${TRANSLATION_CACHE_HASH_UNIQUE} UNIQUE (hash);`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE translation_cache DROP CONSTRAINT IF EXISTS ${TRANSLATION_CACHE_HASH_UNIQUE};`,
  );
  await knex.raw("ALTER TABLE translation_cache DROP COLUMN IF EXISTS hash;");
  await knex.schema.dropTableIfExists("translation_cache");
}
