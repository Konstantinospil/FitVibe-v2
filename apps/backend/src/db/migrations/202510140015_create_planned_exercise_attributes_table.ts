import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("planned_exercise_attributes", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("session_exercise_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("session_exercises")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.integer("sets").nullable();
    table.integer("reps").nullable();
    table.decimal("load", 8, 2).nullable();
    table.decimal("distance", 8, 2).nullable();
    table.specificType("duration", "interval").nullable();
    table.integer("rpe").nullable();
    table.specificType("rest", "interval").nullable();
    table
      .jsonb("extras")
      .notNullable()
      .defaultTo(knex.raw("'{}'::jsonb"));
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("planned_exercise_attributes");
}

