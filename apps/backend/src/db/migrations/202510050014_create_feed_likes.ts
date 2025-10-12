import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('feed_likes', (t) => {
    t.uuid('id').primary();
    t.uuid('post_id').notNullable().references('id').inTable('feed_posts').onDelete('CASCADE');
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.unique(['post_id','user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('feed_likes');
}
