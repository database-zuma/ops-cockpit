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

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err);
    });
  }
  return pool;
}

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
  console.log('[MOCK] SQL:', sql.substring(0, 100) + '...');

  // Stock API mocks
  if (sql.includes('SUM(stock_pairs)') && sql.includes('SUM(stock_value)')) {
    console.log('[MOCK] Matched: stock summary');
    return [{
      total_stock_pairs: '15420',
      total_stock_value: '1250000000',
      avg_ff: '0.82',
      avg_fa: '0.88',
      avg_fs: '0.90',
      store_count: '52',
    }];
  }

  if (sql.includes('CURRENT_DATE - INTERVAL') && sql.includes('avg_ff')) {
    console.log('[MOCK] Matched: FF trend');
    const ffData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date('2026-02-22');
      date.setDate(date.getDate() - i);
      ffData.push({
        report_date: date.toISOString().split('T')[0],
        avg_ff: String(0.75 + Math.random() * 0.15),
        avg_fa: String(0.80 + Math.random() * 0.12),
        avg_fs: String(0.82 + Math.random() * 0.10),
      });
    }
    return ffData;
  }

  if (sql.includes('stock_pairs') && sql.includes('store_name') && sql.includes('ORDER BY ff_pct')) {
    console.log('[MOCK] Matched: stores with stock');
    return [
      { store_name: 'Zuma Mall Bali Galleria', branch: 'Bali', area: 'Denpasar', stock_pairs: '450', stock_value: '85000000', ff_pct: '0.85', fa_pct: '0.88', fs_pct: '0.90', turnover_ratio: '2.5' },
      { store_name: 'Zuma Galaxy Mall', branch: 'Jatim', area: 'Surabaya', stock_pairs: '380', stock_value: '72000000', ff_pct: '0.80', fa_pct: '0.85', fs_pct: '0.87', turnover_ratio: '2.8' },
      { store_name: 'Zuma Level 21', branch: 'Bali', area: 'Denpasar', stock_pairs: '320', stock_value: '68000000', ff_pct: '0.88', fa_pct: '0.90', fs_pct: '0.92', turnover_ratio: '2.2' },
      { store_name: 'Zuma Grand Indonesia', branch: 'Jakarta', area: 'Jakarta Pusat', stock_pairs: '290', stock_value: '55000000', ff_pct: '0.78', fa_pct: '0.82', fs_pct: '0.85', turnover_ratio: '3.1' },
      { store_name: 'Zuma Tunjungan Plaza', branch: 'Jatim', area: 'Surabaya', stock_pairs: '250', stock_value: '49000000', ff_pct: '0.82', fa_pct: '0.86', fs_pct: '0.88', turnover_ratio: '2.9' },
    ];
  }

  // Sales API mocks
  if (sql.includes('CURRENT_DATE - $1::integer') || sql.includes('report_date >=')) {
    console.log('[MOCK] Matched: daily sales trend');
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
    console.log('[MOCK] Matched: MTD by store');
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

  if (sql.includes('SUM(revenue_today)') && sql.includes('GROUP BY branch') && !sql.includes('report_date = (SELECT MAX')) {
    console.log('[MOCK] Matched: sales by branch with date filter');
    return MOCK_DATA.dashboard.branches.map(b => ({
      branch: b.branch,
      revenue: String(b.revenue),
      pairs: String(b.pairs),
      avg_achievement: String(b.achievement),
    }));
  }

  // Dashboard API mocks
  if (sql.includes('mv_ops_daily_summary') && sql.includes('GROUP BY report_date')) {
    console.log('[MOCK] Matched: dashboard hero metrics');
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
    console.log('[MOCK] Matched: branch breakdown');
    return MOCK_DATA.dashboard.branches.map(b => ({
      branch: b.branch,
      revenue: String(b.revenue),
      pairs: String(b.pairs),
      achievement: String(b.achievement),
      ff: String(b.ff),
    }));
  }

  if (sql.includes('ORDER BY revenue_today DESC')) {
    console.log('[MOCK] Matched: top stores');
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

  console.log('[MOCK] No pattern matched, returning empty array');
  return [];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function queryScalar<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const row = await queryOne<Record<string, T>>(sql, params);
  if (!row) return null;
  const firstValue = Object.values(row)[0];
  return firstValue ?? null;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
