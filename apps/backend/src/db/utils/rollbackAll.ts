import { spawnSync } from 'child_process';

console.log('↩️ Rolling back all migrations...');
const result = spawnSync('npx', ['knex', 'migrate:rollback', '--all', '--knexfile', 'src/db/knexfile.ts'], { stdio: 'inherit' });
process.exit(result.status ?? 0);
