import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('system_health', (t) => {
    t.uuid('id').primary();
    t.string('service').notNullable(); // 'db','api','jobs'
    t.string('status').notNullable();  // 'ok','degraded','down'
    t.text('details').nullable();
    t.timestamp('checked_at', { useTz: true }).defaultTo(knex.fn.now());
    t.index(['service','checked_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('system_health');
}
