import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create the PostgreSQL connection pool (singleton pattern)
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PG_HOST || '76.13.194.120',
      port: parseInt(process.env.PG_PORT || '5432', 10),
      database: process.env.PG_DATABASE || 'openclaw_ops',
      user: process.env.PG_USER || 'openclaw_app',
      password: process.env.PG_PASSWORD,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    
    // Error handling for the pool
    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err);
    });
  }
  return pool;
}
  if (!pool) {
    pool = new Pool({
      host: process.env.PG_HOST || '76.13.194.120',
      port: parseInt(process.env.PG_PORT || '5432', 10),
      database: process.env.PG_DATABASE || 'openclaw_ops',
      user: process.env.PG_USER || 'openclaw_app',
      password: process.env.PG_PASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

/**
 * Execute a parameterized query and return rows
 * @param sql - SQL query with $1, $2, etc. placeholders
 * @param params - Query parameters
 * @returns Array of result rows
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Execute a query and return the first row or null
 * @param sql - SQL query with $1, $2, etc. placeholders
 * @param params - Query parameters
 * @returns First result row or null
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute a query that returns a single scalar value
 * @param sql - SQL query with $1, $2, etc. placeholders
 * @param params - Query parameters
 * @returns Scalar value or null
 */
export async function queryScalar<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const row = await queryOne<Record<string, T>>(sql, params);
  if (!row) return null;
  const firstValue = Object.values(row)[0];
  return firstValue ?? null;
}

/**
 * Close the connection pool (for cleanup)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
