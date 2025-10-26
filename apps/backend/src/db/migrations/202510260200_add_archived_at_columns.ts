import type { Knex } from "knex";

const EXERCISES_TABLE = "exercises";
const PLANS_TABLE = "plans";
const EXERCISES_ACTIVE_INDEX = "exercises_owner_active_idx";
const PLANS_ACTIVE_INDEX = "idx_plans_owner_active";

export async function up(knex: Knex): Promise<void> {
  const hasExercisesArchived = await knex.schema.hasColumn(EXERCISES_TABLE, "archived_at");
  if (!hasExercisesArchived) {
    await knex.schema.alterTable(EXERCISES_TABLE, (table) => {
      table.timestamp("archived_at", { useTz: true }).nullable();
    });
  }

  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${EXERCISES_ACTIVE_INDEX} ON ${EXERCISES_TABLE}(owner_id) WHERE archived_at IS NULL`,
  );

  const hasPlansArchived = await knex.schema.hasColumn(PLANS_TABLE, "archived_at");
  if (!hasPlansArchived) {
    await knex.schema.alterTable(PLANS_TABLE, (table) => {
      table.timestamp("archived_at", { useTz: true }).nullable();
    });
  }

  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${PLANS_ACTIVE_INDEX} ON ${PLANS_TABLE}(user_id) WHERE archived_at IS NULL`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${EXERCISES_ACTIVE_INDEX}`);
  await knex.raw(`DROP INDEX IF EXISTS ${PLANS_ACTIVE_INDEX}`);

  const hasExercisesArchived = await knex.schema.hasColumn(EXERCISES_TABLE, "archived_at");
  if (hasExercisesArchived) {
    await knex.schema.alterTable(EXERCISES_TABLE, (table) => {
      table.dropColumn("archived_at");
    });
  }

  const hasPlansArchived = await knex.schema.hasColumn(PLANS_TABLE, "archived_at");
  if (hasPlansArchived) {
    await knex.schema.alterTable(PLANS_TABLE, (table) => {
      table.dropColumn("archived_at");
    });
  }
}
