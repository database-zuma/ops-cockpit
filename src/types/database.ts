/**
 * Daily operations summary from mart.mv_ops_daily_summary
 * Materialized view with daily sales, targets, and metrics per store
 */
export interface OpsDaily {
  report_date: string; // DATE
  branch: string;
  area: string;
  store_name: string;
  store_category: string;
  revenue_today: number; // NUMERIC
  pairs_today: number; // NUMERIC
  asp_today: number; // NUMERIC (Average Selling Price)
  revenue_mtd: number; // NUMERIC (Month-to-Date)
  target_mtd: number; // NUMERIC
  achievement_pct: number | null; // NUMERIC (percentage, can be NULL)
  ff_pct: number; // NUMERIC (Fill Factor as 0-1 fraction)
  fa_pct: number; // NUMERIC (Fill Accuracy as 0-1 fraction)
  fs_pct: number; // NUMERIC (Fill Score, variable scale)
  stock_pairs: number; // BIGINT
  stock_value: number; // NUMERIC
  turnover_ratio: number; // NUMERIC
}

/**
 * Store geographic coordinates from portal.store_coordinates
 * Used for map visualization
 */
export interface StoreCoordinate {
  id: number;
  store_name: string;
  branch: string;
  area: string;
  lat: number; // NUMERIC(10,7)
  lng: number; // NUMERIC(10,7)
  city: string;
  province: string;
}

/**
 * Daily Fill Factor, Fill Accuracy, Fill Score metrics
 * From mart.ff_fa_fs_daily
 */
export interface FfFaFsDaily {
  report_date: string; // DATE
  store_name: string;
  ff_pct: number; // NUMERIC (0-1 fraction)
  fa_pct: number; // NUMERIC (0-1 fraction)
  fs_pct: number; // NUMERIC (variable scale)
  calculated_at: string; // TIMESTAMP
}

/**
 * Monthly store targets from portal.store_monthly_target
 * Used for achievement calculations
 */
export interface StoreTarget {
  store_name: string;
  year: number;
  month: number;
  target_value: number; // NUMERIC
}

/**
 * Query result wrapper for paginated responses
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
