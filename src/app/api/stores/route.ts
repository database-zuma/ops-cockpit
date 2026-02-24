import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cache } from '@/lib/cache';

/**
 * Store map data response shape
 */
export interface StoreMapItem {
  name: string;
  branch: string;
  area: string;
  lat: number;
  lng: number;
  city: string;
  province: string;
  revenue: number;
  pairs: number;
  achievement: number | null;
  ff: number | null;
  stockPairs: number;
}

export interface StoresResponse {
  stores: StoreMapItem[];
}

const CACHE_KEY = 'stores:map';

/**
 * GET /api/stores
 *
 * Returns stores with coordinates and latest daily metrics for map visualization.
 * Joins portal.store_coordinates with latest mart.mv_ops_daily_summary.
 * Cached for 5 minutes.
 */
export async function GET() {
  try {
    const cached = cache.get<StoresResponse>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const sql = `
      SELECT
        sc.store_name,
        sc.branch,
        sc.area,
        sc.latitude,
        sc.longitude,
        sc.city,
        sc.province,
        COALESCE(mv.revenue_today, 0) AS revenue_today,
        COALESCE(mv.pairs_today, 0) AS pairs_today,
        mv.achievement_pct,
        mv.ff_pct,
        COALESCE(mv.stock_pairs, 0) AS stock_pairs
      FROM portal.store_coordinates sc
      LEFT JOIN mart.mv_ops_daily_summary mv
        ON LOWER(TRIM(mv.store_name)) = LOWER(TRIM(sc.store_name))
        AND mv.report_date = (SELECT MAX(report_date) FROM mart.mv_ops_daily_summary)
      WHERE sc.latitude IS NOT NULL
      ORDER BY sc.branch, sc.store_name
    `;

    const rows = await query<{
      store_name: string;
      branch: string;
      area: string;
      latitude: string;
      longitude: string;
      city: string;
      province: string;
      revenue_today: string;
      pairs_today: string;
      achievement_pct: string | null;
      ff_pct: string | null;
      stock_pairs: string;
    }>(sql);

    const stores: StoreMapItem[] = rows.map((row) => ({
      name: row.store_name,
      branch: row.branch,
      area: row.area,
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      city: row.city,
      province: row.province,
      revenue: Number(row.revenue_today),
      pairs: Number(row.pairs_today),
      achievement: row.achievement_pct !== null ? Number(row.achievement_pct) : null,
      ff: row.ff_pct !== null ? Number(row.ff_pct) : null,
      stockPairs: Number(row.stock_pairs),
    }));

    const data: StoresResponse = { stores };
    cache.set(CACHE_KEY, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] /api/stores error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store map data' },
      { status: 500 }
    );
  }
}
