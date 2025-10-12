import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('lookup_tables', (t) => {
    t.uuid('id').primary();
    t.string('namespace').notNullable(); // e.g., 'reasons', 'units'
    t.string('code').notNullable();
    t.string('label').notNullable();
    t.jsonb('meta').nullable();
    t.unique(['namespace','code']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('lookup_tables');
}
