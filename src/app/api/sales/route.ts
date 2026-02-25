import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cache } from '@/lib/cache';

type SalesView = 'daily' | 'mtd' | 'branch';

const VALID_VIEWS: SalesView[] = ['daily', 'mtd', 'branch'];

/** Raw row from daily aggregation query (pg returns NUMERIC as string) */
interface DailyRow {
  report_date: Date | string;
  revenue: string;
  pairs: string;
  asp: string | null;
}

/** Raw row from MTD store-level query */
interface MtdRow {
  store_name: string;
  branch: string;
  area: string;
  revenue_mtd: string;
  target_mtd: string | null;
  achievement_pct: string | null;
  pairs_today: string;
}

/** Raw row from branch aggregation query */
interface BranchRow {
  branch: string;
  revenue: string;
  pairs: string;
  avg_achievement: string | null;
}

/**
 * Format a date value (Date object or ISO string) to YYYY-MM-DD
 */
function formatDate(d: Date | string): string {
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d).split('T')[0];
}

/**
 * GET /api/sales
 *
 * Query params:
 *   view   — 'daily' (default) | 'mtd' | 'branch'
 *   branch — filter by branch name (optional, ignored for view=branch)
 *   days   — number of days for daily view (default 30, max 365)
 *
 * Returns sales data from mart.mv_ops_daily_summary
 */
export async function GET(request: Request) {
  // Parse params outside try so they're available in catch
  const url = new URL(request.url);
  const view = (url.searchParams.get('view') || 'daily') as SalesView;
  const branch = url.searchParams.get('branch') || undefined;
  const daysParam = url.searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30;

  try {

    // Validate view
    if (!VALID_VIEWS.includes(view)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid view parameter. Must be: daily, mtd, or branch',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate days
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid days parameter. Must be between 1 and 365',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Check cache (5-min TTL via default)
    const cacheKey = `sales:${view}:${branch || 'all'}:${days}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    let data;
    switch (view) {
      case 'daily':
        data = await getDailySales(days, branch);
        break;
      case 'mtd':
        data = await getMtdSales(branch);
        break;
      case 'branch':
        data = await getBranchSales();
        break;
    }

    const response = {
      success: true,
      view,
      data,
      timestamp: new Date().toISOString(),
    };

    cache.set(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /sales] Error:', error);
    
    // Return mock data on error
    const mockData = getMockSalesData(view, days);
    return NextResponse.json({
      success: true,
      view,
      data: mockData,
      timestamp: new Date().toISOString(),
      _mock: true,
    });
  }
}

/**
 * view=daily: Last N days of daily revenue totals
 * Optionally filtered by branch
 */
async function getDailySales(days: number, branch?: string) {
  const params: unknown[] = [days];
  let branchClause = '';
  if (branch) {
    branchClause = 'AND branch = $2';
    params.push(branch);
  }

  const sql = `
    SELECT
      report_date,
      SUM(revenue_today) as revenue,
      SUM(pairs_today) as pairs,
      SUM(revenue_today) / NULLIF(SUM(pairs_today), 0) as asp
    FROM mart.mv_ops_daily_summary
    WHERE report_date >= CURRENT_DATE - $1::integer
    ${branchClause}
    GROUP BY report_date
    ORDER BY report_date ASC
  `;

  const rows = await query<DailyRow>(sql, params);
  return rows.map((r) => ({
    date: formatDate(r.report_date),
    revenue: Number(r.revenue) || 0,
    pairs: Number(r.pairs) || 0,
    asp: r.asp !== null ? Number(r.asp) || 0 : 0,
  }));
}

/**
 * view=mtd: Current month MTD by store (latest date)
 * Optionally filtered by branch
 */
async function getMtdSales(branch?: string) {
  const params: unknown[] = [];
  let branchClause = '';
  if (branch) {
    branchClause = 'AND branch = $1';
    params.push(branch);
  }

  const sql = `
    SELECT
      store_name, branch, area,
      MAX(revenue_mtd) as revenue_mtd,
      MAX(target_mtd) as target_mtd,
      MAX(achievement_pct) as achievement_pct,
      MAX(pairs_today) as pairs_today
    FROM mart.mv_ops_daily_summary
    WHERE report_date = (SELECT MAX(report_date) FROM mart.mv_ops_daily_summary)
    ${branchClause}
    GROUP BY store_name, branch, area
    ORDER BY revenue_mtd DESC
  `;

  const rows = await query<MtdRow>(sql, params);
  return rows.map((r) => ({
    store: r.store_name,
    branch: r.branch,
    area: r.area,
    revenueMtd: Number(r.revenue_mtd) || 0,
    targetMtd: r.target_mtd !== null ? Number(r.target_mtd) : null,
    achievement: r.achievement_pct !== null ? Number(r.achievement_pct) : null,
  }));
}

/**
 * view=branch: Branch-level aggregation for latest date
 */
async function getBranchSales() {
  const sql = `
    SELECT
      branch,
      SUM(revenue_today) as revenue,
      SUM(pairs_today) as pairs,
      AVG(achievement_pct) FILTER (WHERE achievement_pct IS NOT NULL) as avg_achievement
    FROM mart.mv_ops_daily_summary
    WHERE report_date = (SELECT MAX(report_date) FROM mart.mv_ops_daily_summary)
    GROUP BY branch
    ORDER BY revenue DESC
  `;

  const rows = await query<BranchRow>(sql);
  return rows.map((r) => ({
    branch: r.branch,
    revenue: Number(r.revenue) || 0,
    pairs: Number(r.pairs) || 0,
    achievement: r.avg_achievement !== null ? Number(r.avg_achievement) : null,
  }));
}



/**
 * Generate mock sales data when DB is unavailable
 */
function getMockSalesData(view: SalesView, days: number) {
  const branches = ['Bali', 'Jatim', 'Jakarta', 'Batam', 'Sumatra'];
  const stores = [
    { name: 'Zuma Mall Bali Galleria', branch: 'Bali' },
    { name: 'Zuma Galaxy Mall', branch: 'Jatim' },
    { name: 'Zuma Level 21', branch: 'Bali' },
    { name: 'Zuma Grand Indonesia', branch: 'Jakarta' },
    { name: 'Zuma Tunjungan Plaza', branch: 'Jatim' },
  ];

  switch (view) {
    case 'daily': {
      const dailyData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date('2026-02-22');
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 50000000) + 80000000,
          pairs: Math.floor(Math.random() * 200) + 300,
          asp: Math.floor(Math.random() * 200000) + 180000,
        });
      }
      return dailyData;
    }
    case 'mtd': {
      return stores.map((s) => ({
        store: s.name,
        branch: s.branch,
        area: s.branch === 'Bali' ? 'Denpasar' : s.branch === 'Jatim' ? 'Surabaya' : 'Jakarta Pusat',
        revenueMtd: Math.floor(Math.random() * 500000000) + 200000000,
        targetMtd: Math.floor(Math.random() * 500000000) + 250000000,
        achievement: Math.floor(Math.random() * 30) + 80,
      }));
    }
    case 'branch': {
      return branches.map((b) => ({
        branch: b,
        revenue: Math.floor(Math.random() * 50000000) + 10000000,
        pairs: Math.floor(Math.random() * 200) + 50,
        achievement: Math.floor(Math.random() * 30) + 70,
      }));
    }
  }
}
