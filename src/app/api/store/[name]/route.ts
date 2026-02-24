import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cache } from '@/lib/cache';

/**
 * Single store detail response shape
 */
export interface StoreDetailResponse {
  store: string;
  branch: string;
  area: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
  // Latest metrics
  revenueToday: number;
  pairsToday: number;
  aspToday: number | null;
  revenueMtd: number;
  targetMtd: number | null;
  achievement: number | null;
  ff: number | null;
  fa: number | null;
  fs: number | null;
  stockPairs: number | null;
  stockValue: number | null;
  // 30-day trend
  trend: Array<{
    date: string;
    revenue: number;
    pairs: number;
    ff: number | null;
  }>;
}

/**
 * GET /api/store/[name]
 *
 * Returns full detail for a single store: latest metrics, 30-day trend,
 * coordinates, and stock info.
 * Cached for 5 minutes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const storeName = decodeURIComponent(name);
    const cacheKey = `store:${storeName}`;

    const cached = cache.get<StoreDetailResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Query 1: Latest metrics for this store
    const metricsSql = `
      SELECT
        store_name,
        branch,
        area,
        COALESCE(revenue_today, 0) AS revenue_today,
        COALESCE(pairs_today, 0) AS pairs_today,
        asp_today,
        COALESCE(revenue_mtd, 0) AS revenue_mtd,
        target_mtd,
        achievement_pct,
        ff_pct,
        fa_pct,
        fs_pct,
        stock_pairs,
        stock_value
      FROM mart.mv_ops_daily_summary
      WHERE LOWER(TRIM(store_name)) = LOWER(TRIM($1))
        AND report_date = (SELECT MAX(report_date) FROM mart.mv_ops_daily_summary)
      LIMIT 1
    `;

    // Query 2: 30-day sales trend
    const trendSql = `
      SELECT
        report_date,
        COALESCE(revenue_today, 0) AS revenue_today,
        COALESCE(pairs_today, 0) AS pairs_today,
        ff_pct
      FROM mart.mv_ops_daily_summary
      WHERE LOWER(TRIM(store_name)) = LOWER(TRIM($1))
        AND report_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY report_date ASC
    `;

    // Query 3: Coordinates
    const coordsSql = `
      SELECT latitude, longitude, city, province
      FROM portal.store_coordinates
      WHERE LOWER(TRIM(store_name)) = LOWER(TRIM($1))
      LIMIT 1
    `;

    // Execute all three queries in parallel
    const [metricsRows, trendRows, coordsRows] = await Promise.all([
      query<{
        store_name: string;
        branch: string;
        area: string;
        revenue_today: string;
        pairs_today: string;
        asp_today: string | null;
        revenue_mtd: string;
        target_mtd: string | null;
        achievement_pct: string | null;
        ff_pct: string | null;
        fa_pct: string | null;
        fs_pct: string | null;
        stock_pairs: string | null;
        stock_value: string | null;
      }>(metricsSql, [storeName]),
      query<{
        report_date: string;
        revenue_today: string;
        pairs_today: string;
        ff_pct: string | null;
      }>(trendSql, [storeName]),
      query<{
        latitude: string | null;
        longitude: string | null;
        city: string | null;
        province: string | null;
      }>(coordsSql, [storeName]),
    ]);

    // 404 if store not found
    if (metricsRows.length === 0) {
      return NextResponse.json(
        { error: `Store not found: ${storeName}` },
        { status: 404 }
      );
    }

    const m = metricsRows[0];
    const coords = coordsRows.length > 0 ? coordsRows[0] : null;

    const data: StoreDetailResponse = {
      store: m.store_name,
      branch: m.branch,
      area: m.area,
      lat: coords?.latitude !== null && coords?.latitude !== undefined ? Number(coords.latitude) : null,
      lng: coords?.longitude !== null && coords?.longitude !== undefined ? Number(coords.longitude) : null,
      city: coords?.city ?? null,
      revenueToday: Number(m.revenue_today),
      pairsToday: Number(m.pairs_today),
      aspToday: m.asp_today !== null ? Number(m.asp_today) : null,
      revenueMtd: Number(m.revenue_mtd),
      targetMtd: m.target_mtd !== null ? Number(m.target_mtd) : null,
      achievement: m.achievement_pct !== null ? Number(m.achievement_pct) : null,
      ff: m.ff_pct !== null ? Number(m.ff_pct) : null,
      fa: m.fa_pct !== null ? Number(m.fa_pct) : null,
      fs: m.fs_pct !== null ? Number(m.fs_pct) : null,
      stockPairs: m.stock_pairs !== null ? Number(m.stock_pairs) : null,
      stockValue: m.stock_value !== null ? Number(m.stock_value) : null,
      trend: trendRows.map((row) => ({
        date: String(row.report_date),
        revenue: Number(row.revenue_today),
        pairs: Number(row.pairs_today),
        ff: row.ff_pct !== null ? Number(row.ff_pct) : null,
      })),
    };

    cache.set(cacheKey, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] /api/store/[name] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store details' },
      { status: 500 }
    );
  }
}
