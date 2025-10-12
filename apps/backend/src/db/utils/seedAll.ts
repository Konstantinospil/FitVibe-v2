import { spawnSync } from 'child_process';

console.log('🌱 Running all seeds...');
const result = spawnSync('npx', ['knex', 'seed:run', '--knexfile', 'src/db/knexfile.ts'], { stdio: 'inherit' });
process.exit(result.status ?? 0);
