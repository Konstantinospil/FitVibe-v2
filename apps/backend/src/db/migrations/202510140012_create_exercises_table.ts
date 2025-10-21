import type { Knex } from "knex";

const EXERCISES_TAGS_INDEX = "exercises_tags_gin_idx";
const EXERCISES_OWNER_ACTIVE_INDEX = "exercises_owner_active_idx";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("exercises", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("owner")
      .nullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
    table.string("name").notNullable();
    table
      .string("type_code")
      .nullable()
      .references("code")
      .inTable("exercise_types")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
    table.string("muscle_group").nullable();
    table.string("equipment").nullable();
    table.jsonb("tags").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.boolean("is_public").notNullable().defaultTo(true);
    table.text("description_en").nullable();
    table.text("description_de").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("archived_at", { useTz: true }).nullable();
  });

  await knex.raw(`CREATE INDEX ${EXERCISES_TAGS_INDEX} ON exercises USING GIN (tags);`);
  await knex.raw(
    `CREATE INDEX ${EXERCISES_OWNER_ACTIVE_INDEX} ON exercises(owner) WHERE archived_at IS NULL;`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${EXERCISES_OWNER_ACTIVE_INDEX};`);
  await knex.raw(`DROP INDEX IF EXISTS ${EXERCISES_TAGS_INDEX};`);
  await knex.schema.dropTableIfExists("exercises");
}
