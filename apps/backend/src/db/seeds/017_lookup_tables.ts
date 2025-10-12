import { Knex } from 'knex';

import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('lookup_tables').del();
  await knex('lookup_tables').insert([
    { id: uuidv4(), namespace: 'units', code: 'kg', label: 'Kilograms', meta: { type: 'mass' } },
    { id: uuidv4(), namespace: 'units', code: 'sec', label: 'Seconds', meta: { type: 'time' } },
    { id: uuidv4(), namespace: 'reasons', code: 'workout_completed', label: 'Workout Completed' }
  ]);
}
