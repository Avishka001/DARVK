import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool: pg.Pool | null = null;

/**
 * Returns a Neon/PostgreSQL connection pool (singleton).
 */
export function getPool(): pg.Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is missing. Set your Neon PostgreSQL connection string in .env'
    );
  }

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  pool = new Pool({
    connectionString,
    ssl:
      process.env.DB_SSL === 'false' || isLocal
        ? false
        : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected PostgreSQL pool error:', err.message);
  });

  return pool;
}

/**
 * Run a parameterised SQL query against Neon PostgreSQL.
 * @param strings Tagged template literal — the SQL string parts
 * @param values  Interpolated values (bound safely as $1, $2, ...)
 */
export async function query<T extends pg.QueryResultRow = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<pg.QueryResult<T>> {
  const p = getPool();
  let sqlText = '';
  const params: any[] = [];

  strings.forEach((str, i) => {
    sqlText += str;
    if (i < values.length) {
      params.push(values[i] === undefined ? null : values[i]);
      sqlText += `$${params.length}`;
    }
  });

  return p.query<T>(sqlText, params);
}

/**
 * Closes the PostgreSQL connection pool gracefully.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export { pg };
