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

  // Connection pooling parameters
  const poolLimit = env.DB_POOL_LIMIT ?? env.DB_CONNECTION_LIMIT ?? '10';
  const poolTimeout = env.DB_POOL_TIMEOUT ?? '10';
  const pgbouncer = String(env.DB_PGBOUNCER ?? 'false').toLowerCase() === 'true';

  const auth = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  const params = new URLSearchParams();

  if (ssl) params.set('sslmode', 'require');
  if (poolLimit) params.set('connection_limit', String(poolLimit));
  if (poolTimeout) params.set('pool_timeout', String(poolTimeout));
  if (pgbouncer) params.set('pgbouncer', 'true');

  const queryString = params.toString() ? `?${params.toString()}` : '';

  return `postgresql://${auth}@${host}:${port}/${name}${queryString}`;
}
