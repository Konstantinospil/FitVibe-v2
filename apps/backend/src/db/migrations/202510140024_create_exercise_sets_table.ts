import { Knex } from "knex";

const TABLE = "exercise_sets";
const IDX_SESSION_SET = "idx_exercise_sets_session";
const IDX_ORDER = "idx_exercise_sets_order";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE, (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("session_exercise_id")
      .notNullable()
      .references("id")
      .inTable("session_exercises")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.integer("order_index").notNullable();
    table.integer("reps").nullable();
    table.decimal("weight_kg", 8, 2).nullable();
    table.integer("distance_m").nullable();
    table.integer("duration_sec").nullable();
    table.integer("rpe").nullable();
    table.text("notes").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.unique(["session_exercise_id", "order_index"]);
  });

  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${IDX_SESSION_SET} ON ${TABLE}(session_exercise_id);`,
  );
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${IDX_ORDER} ON ${TABLE}(session_exercise_id, order_index);`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_ORDER};`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_SESSION_SET};`);
  await knex.schema.alterTable(TABLE, (table) => {
    table.dropUnique(["session_exercise_id", "order_index"]);
  });
  await knex.schema.dropTableIfExists(TABLE);
}
