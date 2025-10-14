import { Knex } from "knex";

const TABLE = "plans";
const IDX_OWNER = "idx_plans_owner";
const IDX_STATUS = "idx_plans_status";
const IDX_ACTIVE = "idx_plans_owner_active";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE, (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.string("name").notNullable();
    table.string("status").notNullable().defaultTo("active");
    table.decimal("progress_percent", 5, 2).notNullable().defaultTo(0);
    table.integer("session_count").notNullable().defaultTo(0);
    table.integer("completed_count").notNullable().defaultTo(0);
    table.date("start_date").nullable();
    table.date("end_date").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("archived_at", { useTz: true }).nullable();
  });

  await knex.raw(`CREATE INDEX IF NOT EXISTS ${IDX_OWNER} ON ${TABLE}(user_id);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS ${IDX_STATUS} ON ${TABLE}(status);`);
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${IDX_ACTIVE} ON ${TABLE}(user_id) WHERE archived_at IS NULL;`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_ACTIVE};`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_STATUS};`);
  await knex.raw(`DROP INDEX IF EXISTS ${IDX_OWNER};`);
  await knex.schema.dropTableIfExists(TABLE);
}
