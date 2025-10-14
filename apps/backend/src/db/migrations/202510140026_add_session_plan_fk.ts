import { Knex } from "knex";

const CONSTRAINT = "sessions_plan_id_fkey";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE sessions
    ADD CONSTRAINT ${CONSTRAINT}
    FOREIGN KEY (plan_id)
    REFERENCES plans(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE sessions
    DROP CONSTRAINT IF EXISTS ${CONSTRAINT};
  `);
}
