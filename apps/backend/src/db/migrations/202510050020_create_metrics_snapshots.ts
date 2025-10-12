import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('metrics_snapshots', (t) => {
    t.uuid('id').primary();
    t.string('metric').notNullable();   // e.g., 'daily_active_users'
    t.decimal('value', 14, 4).notNullable();
    t.timestamp('captured_at', { useTz: true }).notNullable();
    t.jsonb('dimensions').nullable();   // e.g., {region:'eu', plan:'free'}
    t.unique(['metric','captured_at']);
    t.index(['metric','captured_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('metrics_snapshots');
}
