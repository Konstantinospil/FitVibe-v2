import type { Knex } from "knex";

const TABLE = "exercises";
const COLUMN_OLD = "owner";
const COLUMN_NEW = "owner_id";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(TABLE, COLUMN_OLD);
  if (hasColumn) {
    await knex.schema.alterTable(TABLE, (table) => {
      table.renameColumn(COLUMN_OLD, COLUMN_NEW);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(TABLE, COLUMN_NEW);
  if (hasColumn) {
    await knex.schema.alterTable(TABLE, (table) => {
      table.renameColumn(COLUMN_NEW, COLUMN_OLD);
    });
  }
}
