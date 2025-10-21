import type { Knex } from "knex";

const TABLE = "session_exercises";
const IDX_SESSION = "idx_session_exercises_session";
const IDX_EXERCISE = "idx_session_exercises_exercise";
const IDX_ORDER = "idx_session_exercises_order";

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
    table
      .uuid("exercise_id")
      .nullable()
      .references("id")
      .inTable("exercises")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
    table.integer("order_index").notNullable();
    table.text("notes").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.unique(["session_id", "order_index"]);
  });

  await knex.raw(`CREATE INDEX IF NOT EXISTS ${IDX_SESSION} ON ${TABLE}(session_id);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS ${IDX_EXERCISE} ON ${TABLE}(exercise_id);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS ${IDX_ORDER} ON ${TABLE}(session_id, order_index);`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_ORDER};`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_EXERCISE};`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_SESSION};`);
  await knex.schema.alterTable(TABLE, (table) => {
    table.dropUnique(["session_id", "order_index"]);
  });
  await knex.schema.dropTableIfExists(TABLE);
}
