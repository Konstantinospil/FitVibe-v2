import { db } from '../connection.js';

async function verify() {
  console.log('🔍 Verifying DB integrity...');
  const tables = ['users', 'sessions', 'exercises', 'plans'];
  for (const table of tables) {
    const exists = await db.schema.hasTable(table);
    console.log(`${table}: ${exists ? '✅ exists' : '❌ missing'}`);
  }
  await db.destroy();
}
verify();
