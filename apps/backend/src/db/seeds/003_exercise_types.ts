import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('exercise_types').del();
  await knex('exercise_types').insert([
    { code: 'strength', name: 'Strength', description: 'Weightlifting and resistance training' },
    { code: 'cardio', name: 'Cardio', description: 'Aerobic endurance activities' },
    { code: 'mobility', name: 'Mobility', description: 'Stretching and range-of-motion' },
    { code: 'plyometric', name: 'Plyometric', description: 'Explosive movement exercises' },
    { code: 'other', name: 'Other', description: 'Miscellaneous exercise types' }
  ]);
}
