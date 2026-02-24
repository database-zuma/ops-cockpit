import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cache } from '@/lib/cache';

type StockView = 'summary' | 'ff' | 'stores';

interface SummaryRow {
  total_stock_pairs: string | null;
  total_stock_value: string | null;
  avg_ff: string | null;
  avg_fa: string | null;
  avg_fs: string | null;
  store_count: string | null;
}

interface FfTrendRow {
  report_date: string;
  avg_ff: string | null;
  avg_fa: string | null;
  avg_fs: string | null;
}

interface StoreRow {
  store_name: string;
  branch: string;
  area: string;
  stock_pairs: string | null;
  stock_value: string | null;
  ff_pct: string | null;
  fa_pct: string | null;
  fs_pct: string | null;
  turnover_ratio: string | null;
}

function toNum(val: string | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

async function fetchSummary(branch?: string) {
  const params: unknown[] = [];
  let branchClause = '';
  if (branch) {
    params.push(branch);
    branchClause = `AND branch = $${params.length}`;
  }

  const sql = `
    SELECT
      SUM(stock_pairs) as total_stock_pairs,
      SUM(stock_value) as total_stock_value,
      AVG(ff_pct) FILTER (WHERE ff_pct IS NOT NULL) as avg_ff,
      AVG(fa_pct) FILTER (WHERE fa_pct IS NOT NULL) as avg_fa,
      AVG(fs_pct) FILTER (WHERE fs_pct IS NOT NULL) as avg_fs,
      COUNT(*) as store_count
    FROM mart.mv_ops_daily_summary
    WHERE report_date = (SELECT MAX(report_date) FROM mart.mv_ops_daily_summary)
    ${branchClause}
  `;

  const rows = await query<SummaryRow>(sql, params);
  const row = rows[0] || {};

  return {
    view: 'summary' as const,
    data: {
      totalStockPairs: toNum(row.total_stock_pairs) ?? 0,
      totalStockValue: toNum(row.total_stock_value) ?? 0,
      avgFF: toNum(row.avg_ff) ?? 0,
      avgFA: toNum(row.avg_fa) ?? 0,
      avgFS: toNum(row.avg_fs) ?? 0,
      storeCount: toNum(row.store_count) ?? 0,
    },
  };
}

async function fetchFfTrend(branch?: string) {
  const params: unknown[] = [];
  let branchClause = '';
  if (branch) {
    params.push(branch);
    branchClause = `AND branch = $${params.length}`;
  }

  const sql = `
    SELECT
      report_date,
      AVG(ff_pct) FILTER (WHERE ff_pct IS NOT NULL) as avg_ff,
      AVG(fa_pct) FILTER (WHERE fa_pct IS NOT NULL) as avg_fa,
      AVG(fs_pct) FILTER (WHERE fs_pct IS NOT NULL) as avg_fs
    FROM mart.mv_ops_daily_summary
    WHERE report_date >= CURRENT_DATE - INTERVAL '30 days'
    ${branchClause}
    GROUP BY report_date
    ORDER BY report_date ASC
  `;

  const rows = await query<FfTrendRow>(sql, params);

  return {
    view: 'ff' as const,
    data: rows.map((r) => ({
      date: r.report_date,
      avgFF: toNum(r.avg_ff) ?? 0,
      avgFA: toNum(r.avg_fa) ?? 0,
      avgFS: toNum(r.avg_fs) ?? 0,
    })),
  };
}

async function fetchStores(branch?: string) {
  const params: unknown[] = [];
  let branchClause = '';
  if (branch) {
    params.push(branch);
    branchClause = `AND branch = $${params.length}`;
  }

  const sql = `
    SELECT
      store_name, branch, area,
      stock_pairs, stock_value,
      ff_pct, fa_pct, fs_pct,
      turnover_ratio
    FROM mart.mv_ops_daily_summary
    WHERE report_date = (SELECT MAX(report_date) FROM mart.mv_ops_daily_summary)
    ${branchClause}
    ORDER BY ff_pct ASC NULLS LAST
  `;

  const rows = await query<StoreRow>(sql, params);

  return {
    view: 'stores' as const,
    data: rows.map((r) => ({
      store: r.store_name,
      branch: r.branch,
      stockPairs: toNum(r.stock_pairs) ?? 0,
      stockValue: toNum(r.stock_value) ?? 0,
      ff: toNum(r.ff_pct),
      fa: toNum(r.fa_pct),
      fs: toNum(r.fs_pct),
      turnover: toNum(r.turnover_ratio),
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = (searchParams.get('view') || 'summary') as StockView;
    const branch = searchParams.get('branch') || undefined;

    // Validate view parameter
    if (!['summary', 'ff', 'stores'].includes(view)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid view: ${view}. Must be one of: summary, ff, stores`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Build cache key
    const cacheKey = `stock:${view}:${branch || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        ...cached,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch data based on view
    let result: { view: string; data: unknown };
    switch (view) {
      case 'ff':
        result = await fetchFfTrend(branch);
        break;
      case 'stores':
        result = await fetchStores(branch);
        break;
      case 'summary':
      default:
        result = await fetchSummary(branch);
        break;
    }

    // Cache for 5 minutes (default TTL)
    cache.set(cacheKey, result);

    return NextResponse.json({
      success: true,
      ...result,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stock API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
