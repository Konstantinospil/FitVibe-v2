import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sessions', (t) => {
    t.string('visibility', 20).defaultTo('private');
    t.timestamp('completed_at').nullable();
  });
  
  await knex.raw(`
    CREATE INDEX idx_sessions_public_feed 
    ON sessions(created_at DESC) 
    WHERE visibility = 'public' AND status = 'completed';
  `);
}