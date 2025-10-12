import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('exercises', (t) => {
    t.uuid('id').primary();
    t.string('name').notNullable();
    t.string('type_code').notNullable().references('code').inTable('exercise_types').onDelete('RESTRICT');
    t.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.jsonb('default_metrics').nullable(); // e.g., { unit: 'kg' }
    t.boolean('public').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    t.unique(['name', 'created_by']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('exercises');
}
