import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('exercise_sets', (t) => {
    t.uuid('id').primary();
    t.uuid('session_id').notNullable().references('id').inTable('sessions').onDelete('CASCADE');
    t.uuid('session_exercise_id').notNullable().references('id').inTable('session_exercises').onDelete('CASCADE');
    t.timestamp('performed_at', { useTz: true }).defaultTo(knex.fn.now());
    t.integer('set_no').notNullable().defaultTo(1);
    t.integer('reps').nullable();
    t.decimal('load_kg', 8, 2).nullable();
    t.integer('duration_sec').nullable();
    t.integer('distance_m').nullable();
    t.decimal('rpe', 3, 1).nullable();
    t.text('notes').nullable();
    t.index(['session_id', 'session_exercise_id', 'set_no']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('exercise_sets');
}
