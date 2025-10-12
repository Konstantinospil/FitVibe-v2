import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_log', (t) => {
    t.uuid('id').primary();
    t.uuid('actor_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.string('action').notNullable(); // e.g., 'login','create_session','delete_plan'
    t.string('entity').nullable();    // table name or domain entity
    t.string('entity_id').nullable();
    t.jsonb('metadata').nullable();
    t.string('ip').nullable();
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.index(['actor_user_id','action','created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_log');
}
