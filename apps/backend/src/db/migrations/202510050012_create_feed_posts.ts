import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('feed_posts', (t) => {
    t.uuid('id').primary();
    t.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.text('content').notNullable();
    t.jsonb('media').nullable(); // {images:[], video:...}
    t.string('visibility').notNullable().defaultTo('public'); // public|friends|private
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    t.index(['author_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('feed_posts');
}
