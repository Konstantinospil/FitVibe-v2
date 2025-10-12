import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('feed_comments', (t) => {
    t.uuid('id').primary();
    t.uuid('post_id').notNullable().references('id').inTable('feed_posts').onDelete('CASCADE');
    t.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.text('content').notNullable();
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.index(['post_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('feed_comments');
}
