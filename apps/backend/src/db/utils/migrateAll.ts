import { spawnSync } from 'child_process';

console.log('🔼 Applying all migrations...');
const result = spawnSync('npx', ['knex', 'migrate:latest', '--knexfile', 'src/db/knexfile.ts'], { stdio: 'inherit' });
process.exit(result.status ?? 0);
