import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('gdpr_deletion_requests', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable();
    t.string('request_type', 50).notNullable();
    t.specificType('request_ip', 'inet').nullable();
    t.timestamp('requested_at').defaultTo(knex.fn.now());
    t.timestamp('completed_at').nullable();
    t.index(['user_id', 'requested_at']);
  });
}