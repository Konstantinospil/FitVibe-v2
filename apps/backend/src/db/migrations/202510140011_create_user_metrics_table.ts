import type { Knex } from "knex";

const USER_METRICS_INDEX = "user_metrics_user_id_recorded_at_idx";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_metrics", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.decimal("weight", 6, 2).nullable();
    table.string("unit").notNullable().defaultTo("kg");
    table
      .string("fitness_level_code")
      .nullable()
      .references("code")
      .inTable("fitness_levels")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
    table.string("training_frequency").nullable();
    table.string("photo_url").nullable();
    table.timestamp("recorded_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("user_metrics", (table) => {
    table.index(["user_id", "recorded_at"], USER_METRICS_INDEX);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user_metrics", (table) => {
    table.dropIndex(["user_id", "recorded_at"], USER_METRICS_INDEX);
  });
  await knex.schema.dropTableIfExists("user_metrics");
}
