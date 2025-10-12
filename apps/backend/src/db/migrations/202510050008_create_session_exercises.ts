import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('session_exercises', (t) => {
    t.uuid('id').primary();
    t.uuid('session_id').notNullable().references('id').inTable('sessions').onDelete('CASCADE');
    t.uuid('exercise_id').notNullable().references('id').inTable('exercises').onDelete('RESTRICT');
    t.integer('ord').notNullable().defaultTo(1);
    t.integer('target_sets').nullable();
    t.integer('target_reps').nullable();
    t.integer('target_duration_sec').nullable();
    t.integer('target_distance_m').nullable();
    t.decimal('target_load_kg', 8, 2).nullable();
    t.integer('rest_sec').nullable();
    t.jsonb('meta').nullable();
    t.index(['session_id', 'ord']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('session_exercises');
}
