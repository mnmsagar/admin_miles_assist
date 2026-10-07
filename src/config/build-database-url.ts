/**
 * Builds a PostgreSQL connection URL from individual DB_* environment
 * variables. This is the single source of truth for the connection — the
 * app (PrismaService) and the Prisma CLI wrapper both use it, so a full
 * DATABASE_URL never needs to be written by hand.
 */
export function buildDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const host = env.DB_HOST ?? 'localhost';
  const port = env.DB_PORT ?? '5432';
  const user = env.DB_USER ?? 'postgres';
  const password = env.DB_PASSWORD ?? '';
  const name = env.DB_NAME ?? 'postgres';
  const ssl = String(env.DB_SSL ?? 'false').toLowerCase() === 'true';

  const auth = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  const query = ssl ? '?sslmode=require' : '';

  return `postgresql://${auth}@${host}:${port}/${name}${query}`;
}
