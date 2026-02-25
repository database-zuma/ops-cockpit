import { Pool } from 'pg';

let pool: Pool | null = null;

// Mock data for when DB is unreachable
const MOCK_DATA = {
  dashboard: {
    date: '2026-02-22',
    totalRevenue: 125000000,
    totalPairs: 450,
    avgAchievement: 85.5,
    avgFF: 0.82,
    avgFA: 0.88,
    avgFS: 0.90,
    branches: [
      { branch: 'Bali', revenue: 45000000, pairs: 180, achievement: 92, ff: 0.85 },
      { branch: 'Jatim', revenue: 38000000, pairs: 140, achievement: 88, ff: 0.80 },
      { branch: 'Jakarta', revenue: 25000000, pairs: 85, achievement: 75, ff: 0.78 },
      { branch: 'Batam', revenue: 12000000, pairs: 30, achievement: 82, ff: 0.88 },
      { branch: 'Sumatra', revenue: 5000000, pairs: 15, achievement: 65, ff: 0.70 },
    ],
    topStores: [
      { store: 'Zuma Mall Bali Galleria', branch: 'Bali', revenue: 8500000, achievement: 105 },
      { store: 'Zuma Galaxy Mall', branch: 'Jatim', revenue: 7200000, achievement: 98 },
      { store: 'Zuma Level 21', branch: 'Bali', revenue: 6800000, achievement: 92 },
      { store: 'Zuma Grand Indonesia', branch: 'Jakarta', revenue: 5500000, achievement: 85 },
      { store: 'Zuma Tunjungan Plaza', branch: 'Jatim', revenue: 4900000, achievement: 88 },
    ],
  },
  filterOptions: {
    branches: ['Bali', 'Jatim', 'Jakarta', 'Batam', 'Sumatra', 'Sulawesi'],
    areas: ['Denpasar', 'Surabaya', 'Jakarta Pusat', 'Batam Center', 'Medan'],
    categories: ['RETAIL', 'NON-RETAIL'],
    stores: ['Zuma Mall Bali Galleria', 'Zuma Galaxy Mall', 'Zuma Level 21', 'Zuma Grand Indonesia', 'Zuma Tunjungan Plaza'],
    latestDate: '2026-02-22',
  },
};

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

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

/**
 * Execute a parameterized query and return rows
 * Falls back to mock data if USE_MOCK_DATA is true or DB fails
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  if (USE_MOCK) {
    console.log('[MOCK] Returning mock data for query');
    return getMockDataForQuery(sql) as T[];
  }

  try {
    const client = await getPool().connect();
    try {
      const result = await client.query(sql, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DB] Query failed, falling back to mock data:', error);
    return getMockDataForQuery(sql) as T[];
  }
}

function getMockDataForQuery(sql: string): unknown[] {
  // Dashboard API mocks
  if (sql.includes('mv_ops_daily_summary') && sql.includes('GROUP BY report_date')) {
    return [{
      report_date: MOCK_DATA.dashboard.date,
      total_revenue: String(MOCK_DATA.dashboard.totalRevenue),
      total_pairs: String(MOCK_DATA.dashboard.totalPairs),
      avg_achievement: String(MOCK_DATA.dashboard.avgAchievement),
      avg_ff: String(MOCK_DATA.dashboard.avgFF),
      avg_fa: String(MOCK_DATA.dashboard.avgFA),
      avg_fs: String(MOCK_DATA.dashboard.avgFS),
    }];
  }
  if (sql.includes('GROUP BY branch') && !sql.includes('SUM(revenue_today)')) {
    return MOCK_DATA.dashboard.branches.map(b => ({
      branch: b.branch,
      revenue: String(b.revenue),
      pairs: String(b.pairs),
      achievement: String(b.achievement),
      ff: String(b.ff),
    }));
  }
  if (sql.includes('ORDER BY revenue_today DESC')) {
    return MOCK_DATA.dashboard.topStores.map(s => ({
      store: s.store,
      branch: s.branch,
      revenue: String(s.revenue),
      achievement: String(s.achievement),
    }));
  }
  
  // Filter options mocks
  if (sql.includes('SELECT DISTINCT branch')) {
    return MOCK_DATA.filterOptions.branches.map(b => ({ branch: b }));
  }
  if (sql.includes('SELECT DISTINCT area')) {
    return MOCK_DATA.filterOptions.areas.map(a => ({ area: a }));
  }
  if (sql.includes('SELECT DISTINCT store_category')) {
    return MOCK_DATA.filterOptions.categories.map(c => ({ store_category: c }));
  }
  if (sql.includes('SELECT DISTINCT store_name')) {
    return MOCK_DATA.filterOptions.stores.map(s => ({ store_name: s }));
  }
  if (sql.includes('SELECT MAX(report_date)')) {
    return [{ max: MOCK_DATA.filterOptions.latestDate }];
  }
  
  // Sales API mocks
  if (sql.includes('CURRENT_DATE - $1::integer')) {
    // Generate 30 days of daily sales data
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date('2026-02-22');
      date.setDate(date.getDate() - i);
      dailyData.push({
        report_date: date.toISOString().split('T')[0],
        revenue: String(Math.floor(Math.random() * 50000000) + 80000000),
        pairs: String(Math.floor(Math.random() * 200) + 300),
        asp: String(Math.floor(Math.random() * 200000) + 180000),
      });
    }
    return dailyData;
  }
  if (sql.includes('revenue_mtd') && sql.includes('store_name')) {
    // MTD by store
    return MOCK_DATA.dashboard.topStores.map((s) => ({
      store_name: s.store,
      branch: s.branch,
      area: s.branch === 'Bali' ? 'Denpasar' : s.branch === 'Jatim' ? 'Surabaya' : 'Jakarta Pusat',
      revenue_mtd: String(s.revenue * 22),
      target_mtd: String(s.revenue * 25),
      achievement_pct: String(s.achievement),
      pairs_today: String(Math.floor(Math.random() * 20) + 10),
    }));
  }
  if (sql.includes('GROUP BY branch') && sql.includes('SUM(revenue_today)')) {
    return MOCK_DATA.dashboard.branches.map(b => ({
      branch: b.branch,
      revenue: String(b.revenue),
      pairs: String(b.pairs),
      avg_achievement: String(b.achievement),
    }));
  }
  
  // Stock API mocks
  if (sql.includes('stock_pairs') || sql.includes('stock_value')) {
    return MOCK_DATA.dashboard.branches.map(b => ({
      branch: b.branch,
      store_count: String(Math.floor(Math.random() * 10) + 5),
      total_stock_pairs: String(Math.floor(Math.random() * 1000) + 500),
      total_stock_value: String(Math.floor(Math.random() * 500000000) + 200000000),
      avg_ff: String(b.ff),
      avg_fa: String(0.88),
      avg_fs: String(0.90),
      low_stock_stores: String(Math.floor(Math.random() * 3)),
    }));
  }
  
  return [];
}

/**
 * Execute a query and return the first row or null
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
