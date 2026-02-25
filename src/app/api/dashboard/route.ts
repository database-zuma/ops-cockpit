import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cache } from '@/lib/cache';

/**
 * Dashboard hero metrics response shape
 */
export interface DashboardResponse {
  date: string;
  totalRevenue: number;
  totalPairs: number;
  avgAchievement: number | null;
  avgFF: number | null;
  avgFA: number | null;
  avgFS: number | null;
  branches: Array<{
    branch: string;
    revenue: number;
    pairs: number;
    achievement: number | null;
    ff: number | null;
  }>;
  topStores: Array<{
    store: string;
    branch: string;
    revenue: number;
    achievement: number | null;
  }>;
}

/**
 * GET /api/dashboard
 *
 * Returns hero metrics for the dashboard homepage.
 * Optional query params: ?branch=<name>&date=<YYYY-MM-DD>
 * Cached for 5 minutes.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || null;
    const date = searchParams.get('date') || null;

    const cacheKey = `dashboard:${branch}:${date}`;
    const cached = cache.get<DashboardResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build dynamic WHERE conditions
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (date) {
      conditions.push(`report_date = $${paramIndex}`);
      params.push(date);
      paramIndex++;
    } else {
      conditions.push(
        `report_date = (SELECT MAX(report_date) FROM mart.mv_ops_daily_summary)`
      );
    }

    if (branch) {
      conditions.push(`branch = $${paramIndex}`);
      params.push(branch);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Hero metrics query
    const heroSql = `
      SELECT
        report_date,
        COALESCE(SUM(revenue_today), 0) AS total_revenue,
        COALESCE(SUM(pairs_today), 0) AS total_pairs,
        AVG(achievement_pct) FILTER (WHERE achievement_pct IS NOT NULL) AS avg_achievement,
        AVG(ff_pct) FILTER (WHERE ff_pct IS NOT NULL) AS avg_ff,
        AVG(fa_pct) FILTER (WHERE fa_pct IS NOT NULL) AS avg_fa,
        AVG(fs_pct) FILTER (WHERE fs_pct IS NOT NULL) AS avg_fs
      FROM mart.mv_ops_daily_summary
      WHERE ${whereClause}
      GROUP BY report_date
    `;

    // Branch breakdown query
    const branchSql = `
      SELECT
        branch,
        COALESCE(SUM(revenue_today), 0) AS revenue,
        COALESCE(SUM(pairs_today), 0) AS pairs,
        AVG(achievement_pct) FILTER (WHERE achievement_pct IS NOT NULL) AS achievement,
        AVG(ff_pct) FILTER (WHERE ff_pct IS NOT NULL) AS ff
      FROM mart.mv_ops_daily_summary
      WHERE ${whereClause}
      GROUP BY branch
      ORDER BY revenue DESC
    `;

    // Top 5 stores by revenue
    const topStoresSql = `
      SELECT
        store_name AS store,
        branch,
        COALESCE(revenue_today, 0) AS revenue,
        achievement_pct AS achievement
      FROM mart.mv_ops_daily_summary
      WHERE ${whereClause}
      ORDER BY revenue_today DESC NULLS LAST
      LIMIT 5
    `;

    // Execute all three queries in parallel
    const [heroRows, branchRows, storeRows] = await Promise.all([
      query<{
        report_date: string;
        total_revenue: string;
        total_pairs: string;
        avg_achievement: string | null;
        avg_ff: string | null;
        avg_fa: string | null;
        avg_fs: string | null;
      }>(heroSql, params),
      query<{
        branch: string;
        revenue: string;
        pairs: string;
        achievement: string | null;
        ff: string | null;
      }>(branchSql, params),
      query<{
        store: string;
        branch: string;
        revenue: string;
        achievement: string | null;
      }>(topStoresSql, params),
    ]);

    // Handle empty results (no data for the given date/filters)
    if (heroRows.length === 0) {
      const emptyResponse: DashboardResponse = {
        date: date || new Date().toISOString().split('T')[0],
        totalRevenue: 0,
        totalPairs: 0,
        avgAchievement: null,
        avgFF: null,
        avgFA: null,
        avgFS: null,
        branches: [],
        topStores: [],
      };
      cache.set(cacheKey, emptyResponse);
      return NextResponse.json(emptyResponse);
    }

    const hero = heroRows[0];

    const data: DashboardResponse = {
      date: String(hero.report_date),
      totalRevenue: Number(hero.total_revenue),
      totalPairs: Number(hero.total_pairs),
      avgAchievement: hero.avg_achievement !== null ? Number(hero.avg_achievement) : null,
      avgFF: hero.avg_ff !== null ? Number(hero.avg_ff) : null,
      avgFA: hero.avg_fa !== null ? Number(hero.avg_fa) : null,
      avgFS: hero.avg_fs !== null ? Number(hero.avg_fs) : null,
      branches: branchRows.map((row) => ({
        branch: row.branch,
        revenue: Number(row.revenue),
        pairs: Number(row.pairs),
        achievement: row.achievement !== null ? Number(row.achievement) : null,
        ff: row.ff !== null ? Number(row.ff) : null,
      })),
      topStores: storeRows.map((row) => ({
        store: row.store,
        branch: row.branch,
        revenue: Number(row.revenue),
        achievement: row.achievement !== null ? Number(row.achievement) : null,
      })),
    };

    cache.set(cacheKey, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] /api/dashboard error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics', details: errorMessage },
      { status: 500 }
    );
  }
}
