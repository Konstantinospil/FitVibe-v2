import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasBase64 = await knex.schema.hasColumn('users', 'avatar_base64');
  if (!hasBase64) {
    await knex.schema.alterTable('users', (t) => {
      t.text('avatar_base64').nullable();
      t.timestamp('avatar_updated_at', { useTz: true }).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasBase64 = await knex.schema.hasColumn('users', 'avatar_base64');
  if (hasBase64) {
    await knex.schema.alterTable('users', (t) => {
      t.dropColumn('avatar_base64');
      t.dropColumn('avatar_updated_at');
    });
  }
}
