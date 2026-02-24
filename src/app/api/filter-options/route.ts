import { NextResponse } from 'next/server';
import { query, queryScalar } from '@/lib/db';
import { cache } from '@/lib/cache';

/**
 * Filter options response shape
 */
export interface FilterOptionsResponse {
  branches: string[];
  areas: string[];
  categories: string[];
  stores: string[];
  latestDate: string;
}

const CACHE_KEY = 'filter-options';

/**
 * GET /api/filter-options
 *
 * Returns distinct branches, areas, store categories, and store names
 * for populating filter dropdowns. Cached for 5 minutes.
 */
export async function GET() {
  try {
    const cached = cache.get<FilterOptionsResponse>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const [branchRows, areaRows, categoryRows, storeRows, latestDate] = await Promise.all([
      query<{ branch: string }>(
        `SELECT DISTINCT branch FROM mart.mv_ops_daily_summary WHERE branch IS NOT NULL ORDER BY branch`
      ),
      query<{ area: string }>(
        `SELECT DISTINCT area FROM mart.mv_ops_daily_summary WHERE area IS NOT NULL ORDER BY area`
      ),
      query<{ store_category: string }>(
        `SELECT DISTINCT store_category FROM mart.mv_ops_daily_summary WHERE store_category IS NOT NULL ORDER BY store_category`
      ),
      query<{ store_name: string }>(
        `SELECT DISTINCT store_name FROM mart.mv_ops_daily_summary
         WHERE report_date = (SELECT MAX(report_date) FROM mart.mv_ops_daily_summary)
         ORDER BY store_name`
      ),
      queryScalar<string>(
        `SELECT MAX(report_date) FROM mart.mv_ops_daily_summary`
      ),
    ]);

    const data: FilterOptionsResponse = {
      branches: branchRows.map((r) => r.branch),
      areas: areaRows.map((r) => r.area),
      categories: categoryRows.map((r) => r.store_category),
      stores: storeRows.map((r) => r.store_name),
      latestDate: latestDate ? String(latestDate) : new Date().toISOString().split('T')[0],
    };

    cache.set(CACHE_KEY, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] /api/filter-options error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
