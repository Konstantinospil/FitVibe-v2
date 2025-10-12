import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary();
    t.string('username').notNullable();
    t.string('email').notNullable();
    t.string('password_hash').notNullable();
    t.string('role').notNullable().references('code').inTable('roles').onDelete('RESTRICT');
    t.string('status').notNullable().defaultTo('active');
    t.jsonb('bio').nullable();
    t.jsonb('locale').nullable();
    t.jsonb('avatar_url').nullable();
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
