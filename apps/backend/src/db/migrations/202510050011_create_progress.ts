import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('progress', (t) => {
    t.uuid('id').primary();
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('exercise_id').nullable().references('id').inTable('exercises').onDelete('SET NULL');
    t.string('metric').notNullable();   // e.g., '1RM', '5K_time'
    t.decimal('value', 12, 4).notNullable();
    t.string('unit').notNullable();     // 'kg', 'sec'
    t.timestamp('measured_at', { useTz: true }).notNullable();
    t.text('notes').nullable();
    t.unique(['user_id','metric','measured_at','exercise_id']);
    t.index(['user_id', 'metric', 'measured_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('progress');
}
