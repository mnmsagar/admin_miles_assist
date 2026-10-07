/**
 * Wrapper for Prisma CLI commands. Loads .env, composes DATABASE_URL from the
 * individual DB_* variables, injects it into the environment, then runs the
 * given command. Keeps DATABASE_URL out of .env entirely.
 *
 * Usage: ts-node scripts/with-db-url.ts npx prisma migrate dev
 */
import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv';
import { buildDatabaseUrl } from '../src/config/build-database-url';

dotenv.config();
process.env.DATABASE_URL = buildDatabaseUrl();

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: ts-node scripts/with-db-url.ts <command> [...args]');
  process.exit(1);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
