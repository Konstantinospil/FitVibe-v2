import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('translations', (t) => {
    t.uuid('id').primary();
    t.string('key').notNullable();       // i18n key
    t.string('locale').notNullable();    // 'en','de',...
    t.text('value').notNullable();
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    t.unique(['key','locale']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('translations');
}
