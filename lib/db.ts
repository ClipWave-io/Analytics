import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES || process.env.DATABASE_PRIVATE_URL;

const g = globalThis as any;
if (!g.__analyticsPool && DATABASE_URL) {
  const isRailwayInternal = DATABASE_URL.includes('.railway.internal');
  const isRailwayProxy = DATABASE_URL.includes('rlwy.net') || DATABASE_URL.includes('railway.app');
  const ssl = isRailwayInternal ? false : isRailwayProxy ? { rejectUnauthorized: false } : undefined;
  g.__analyticsPool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    ssl,
  });
}

export function getPool(): Pool | null {
  return g.__analyticsPool || null;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  if (!pool) throw new Error('Database not configured');
  return pool.query(text, params);
}
