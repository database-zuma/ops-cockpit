import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock db module
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  queryScalar: vi.fn(),
}));

// Mock cache module
vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    has: vi.fn(),
  },
}));

import { GET } from '@/app/api/stores/route';
import { query } from '@/lib/db';
import { cache } from '@/lib/cache';

const mockQuery = vi.mocked(query);
const mockCacheGet = vi.mocked(cache.get);
const mockCacheSet = vi.mocked(cache.set);

// Sample store rows from DB (with coordinates + metrics)
const storeRows = [
  {
    store_name: 'ZUMA Kuta Beach Walk',
    branch: 'Bali',
    area: 'Kuta',
    latitude: '-8.7175300',
    longitude: '115.1685900',
    city: 'Badung',
    province: 'Bali',
    revenue_today: '12000000',
    pairs_today: '85',
    achievement_pct: '0.95',
    ff_pct: '0.88',
    stock_pairs: '320',
  },
  {
    store_name: 'ZUMA Tunjungan Plaza',
    branch: 'Jatim',
    area: 'Surabaya',
    latitude: '-7.2614100',
    longitude: '112.7381100',
    city: 'Surabaya',
    province: 'Jawa Timur',
    revenue_today: '10000000',
    pairs_today: '72',
    achievement_pct: '0.88',
    ff_pct: '0.83',
    stock_pairs: '280',
  },
];

// Store row without metrics (LEFT JOIN returned nulls)
const storeWithoutMetrics = {
  store_name: 'ZUMA New Store',
  branch: 'Jakarta',
  area: 'CBD',
  latitude: '-6.1751000',
  longitude: '106.8650000',
  city: 'Jakarta',
  province: 'DKI Jakarta',
  revenue_today: '0',
  pairs_today: '0',
  achievement_pct: null,
  ff_pct: null,
  stock_pairs: '0',
};

describe('GET /api/stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  describe('cache behavior', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        stores: [
          {
            name: 'ZUMA Kuta Beach Walk',
            branch: 'Bali',
            area: 'Kuta',
            lat: -8.71753,
            lng: 115.16859,
            city: 'Badung',
            province: 'Bali',
            revenue: 12000000,
            pairs: 85,
            achievement: 0.95,
            ff: 0.88,
            stockPairs: 320,
          },
        ],
      };
      mockCacheGet.mockReturnValue(cachedData);

      const response = await GET();
      const json = await response.json();

      expect(json).toEqual(cachedData);
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockCacheGet).toHaveBeenCalledWith('stores:map');
    });

    it('should cache DB results on cache miss', async () => {
      mockQuery.mockResolvedValueOnce(storeRows);

      await GET();

      expect(mockCacheSet).toHaveBeenCalledTimes(1);
      expect(mockCacheSet).toHaveBeenCalledWith(
        'stores:map',
        expect.objectContaining({
          stores: expect.arrayContaining([
            expect.objectContaining({ name: 'ZUMA Kuta Beach Walk' }),
          ]),
        })
      );
    });
  });

  describe('DB query on cache miss', () => {
    it('should return stores with lat/lng and metrics', async () => {
      mockQuery.mockResolvedValueOnce(storeRows);

      const response = await GET();
      const json = await response.json();

      expect(json.stores).toHaveLength(2);

      const store = json.stores[0];
      expect(store.name).toBe('ZUMA Kuta Beach Walk');
      expect(store.branch).toBe('Bali');
      expect(store.area).toBe('Kuta');
      expect(store.lat).toBe(-8.71753);
      expect(store.lng).toBe(115.16859);
      expect(store.city).toBe('Badung');
      expect(store.province).toBe('Bali');
      expect(store.revenue).toBe(12000000);
      expect(store.pairs).toBe(85);
      expect(store.achievement).toBe(0.95);
      expect(store.ff).toBe(0.88);
      expect(store.stockPairs).toBe(320);
    });

    it('should handle stores without metrics (new stores, no sales yet)', async () => {
      mockQuery.mockResolvedValueOnce([storeWithoutMetrics]);

      const response = await GET();
      const json = await response.json();

      expect(json.stores).toHaveLength(1);
      const store = json.stores[0];
      expect(store.name).toBe('ZUMA New Store');
      expect(store.lat).toBe(-6.1751);
      expect(store.lng).toBe(106.865);
      expect(store.revenue).toBe(0);
      expect(store.pairs).toBe(0);
      expect(store.achievement).toBeNull();
      expect(store.ff).toBeNull();
      expect(store.stockPairs).toBe(0);
    });

    it('should query with JOIN on store_coordinates and mv_ops_daily_summary', async () => {
      mockQuery.mockResolvedValueOnce(storeRows);

      await GET();

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('portal.store_coordinates');
      expect(sql).toContain('mart.mv_ops_daily_summary');
      expect(sql).toContain('LEFT JOIN');
      expect(sql).toContain('MAX(report_date)');
      expect(sql).toContain('latitude IS NOT NULL');
    });

    it('should return empty array when no stores have coordinates', async () => {
      mockQuery.mockResolvedValueOnce([]);

      const response = await GET();
      const json = await response.json();

      expect(json.stores).toEqual([]);
    });
  });

  describe('numeric conversions', () => {
    it('should convert PostgreSQL numeric strings to numbers', async () => {
      mockQuery.mockResolvedValueOnce(storeRows);

      const response = await GET();
      const json = await response.json();

      const store = json.stores[0];
      expect(typeof store.lat).toBe('number');
      expect(typeof store.lng).toBe('number');
      expect(typeof store.revenue).toBe('number');
      expect(typeof store.pairs).toBe('number');
      expect(typeof store.achievement).toBe('number');
      expect(typeof store.ff).toBe('number');
      expect(typeof store.stockPairs).toBe('number');
    });

    it('should handle null achievement and ff values', async () => {
      mockQuery.mockResolvedValueOnce([storeWithoutMetrics]);

      const response = await GET();
      const json = await response.json();

      expect(json.stores[0].achievement).toBeNull();
      expect(json.stores[0].ff).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should return 500 on DB error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const response = await GET();

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to fetch store map data');
    });
  });
});
