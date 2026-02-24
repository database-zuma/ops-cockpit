import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

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

import { GET } from '@/app/api/store/[name]/route';
import { query } from '@/lib/db';
import { cache } from '@/lib/cache';

const mockQuery = vi.mocked(query);
const mockCacheGet = vi.mocked(cache.get);
const mockCacheSet = vi.mocked(cache.set);

// Sample DB rows
const metricsRow = {
  store_name: 'Zuma PTC',
  branch: 'Jatim',
  area: 'Surabaya',
  revenue_today: '8500000',
  pairs_today: '56',
  asp_today: '151786',
  revenue_mtd: '125000000',
  target_mtd: '150000000',
  achievement_pct: '0.83',
  ff_pct: '0.85',
  fa_pct: '0.72',
  fs_pct: '0.61',
  stock_pairs: '1200',
  stock_value: '180000000',
};

const trendRows = [
  { report_date: '2026-02-20', revenue_today: '7000000', pairs_today: '48', ff_pct: '0.84' },
  { report_date: '2026-02-21', revenue_today: '8000000', pairs_today: '52', ff_pct: '0.85' },
  { report_date: '2026-02-22', revenue_today: '8500000', pairs_today: '56', ff_pct: '0.85' },
];

const coordsRow = {
  latitude: '-7.2756',
  longitude: '112.7419',
  city: 'Surabaya',
  province: 'Jawa Timur',
};

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

function makeParams(name: string): { params: Promise<{ name: string }> } {
  return { params: Promise.resolve({ name }) };
}

describe('GET /api/store/[name]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  describe('returns store data for valid store name', () => {
    it('should query DB and return formatted response', async () => {
      mockQuery
        .mockResolvedValueOnce([metricsRow])
        .mockResolvedValueOnce(trendRows)
        .mockResolvedValueOnce([coordsRow]);

      const response = await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );
      const json = await response.json();

      expect(json.store).toBe('Zuma PTC');
      expect(json.branch).toBe('Jatim');
      expect(json.area).toBe('Surabaya');
      expect(json.lat).toBe(-7.2756);
      expect(json.lng).toBe(112.7419);
      expect(json.city).toBe('Surabaya');
      expect(json.revenueToday).toBe(8500000);
      expect(json.pairsToday).toBe(56);
      expect(json.aspToday).toBe(151786);
      expect(json.revenueMtd).toBe(125000000);
      expect(json.targetMtd).toBe(150000000);
      expect(json.achievement).toBe(0.83);
      expect(json.ff).toBe(0.85);
      expect(json.fa).toBe(0.72);
      expect(json.fs).toBe(0.61);
      expect(json.stockPairs).toBe(1200);
      expect(json.stockValue).toBe(180000000);
    });

    it('should return trend array with correct shape', async () => {
      mockQuery
        .mockResolvedValueOnce([metricsRow])
        .mockResolvedValueOnce(trendRows)
        .mockResolvedValueOnce([coordsRow]);

      const response = await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );
      const json = await response.json();

      expect(json.trend).toHaveLength(3);
      expect(json.trend[0]).toEqual({
        date: '2026-02-20',
        revenue: 7000000,
        pairs: 48,
        ff: 0.84,
      });
      expect(json.trend[2].revenue).toBe(8500000);
    });

    it('should handle null metric values', async () => {
      const metricsWithNulls = {
        ...metricsRow,
        asp_today: null,
        target_mtd: null,
        achievement_pct: null,
        ff_pct: null,
        fa_pct: null,
        fs_pct: null,
        stock_pairs: null,
        stock_value: null,
      };
      mockQuery
        .mockResolvedValueOnce([metricsWithNulls])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );
      const json = await response.json();

      expect(json.aspToday).toBeNull();
      expect(json.targetMtd).toBeNull();
      expect(json.achievement).toBeNull();
      expect(json.ff).toBeNull();
      expect(json.fa).toBeNull();
      expect(json.fs).toBeNull();
      expect(json.stockPairs).toBeNull();
      expect(json.stockValue).toBeNull();
      expect(json.lat).toBeNull();
      expect(json.lng).toBeNull();
      expect(json.city).toBeNull();
      expect(json.trend).toEqual([]);
    });

    it('should execute 3 parallel queries', async () => {
      mockQuery
        .mockResolvedValueOnce([metricsRow])
        .mockResolvedValueOnce(trendRows)
        .mockResolvedValueOnce([coordsRow]);

      await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );

      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should pass store name to all queries', async () => {
      mockQuery
        .mockResolvedValueOnce([metricsRow])
        .mockResolvedValueOnce(trendRows)
        .mockResolvedValueOnce([coordsRow]);

      await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );

      // All 3 queries should receive the store name as parameter
      expect(mockQuery.mock.calls[0][1]).toEqual(['Zuma PTC']);
      expect(mockQuery.mock.calls[1][1]).toEqual(['Zuma PTC']);
      expect(mockQuery.mock.calls[2][1]).toEqual(['Zuma PTC']);
    });

    it('should convert PostgreSQL numeric strings to numbers', async () => {
      mockQuery
        .mockResolvedValueOnce([metricsRow])
        .mockResolvedValueOnce(trendRows)
        .mockResolvedValueOnce([coordsRow]);

      const response = await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );
      const json = await response.json();

      expect(typeof json.revenueToday).toBe('number');
      expect(typeof json.pairsToday).toBe('number');
      expect(typeof json.revenueMtd).toBe('number');
      expect(typeof json.lat).toBe('number');
      expect(typeof json.trend[0].revenue).toBe('number');
    });
  });

  describe('returns 404 for unknown store', () => {
    it('should return 404 when store not found in metrics', async () => {
      mockQuery
        .mockResolvedValueOnce([])   // metrics: empty
        .mockResolvedValueOnce([])   // trend: empty
        .mockResolvedValueOnce([]);  // coords: empty

      const response = await GET(
        makeRequest('/api/store/Nonexistent%20Store'),
        makeParams('Nonexistent Store')
      );

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toContain('Nonexistent Store');
    });
  });

  describe('URL-encoded store names work', () => {
    it('should decode URL-encoded store name (e.g., "Zuma%20PTC")', async () => {
      mockQuery
        .mockResolvedValueOnce([metricsRow])
        .mockResolvedValueOnce(trendRows)
        .mockResolvedValueOnce([coordsRow]);

      const response = await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma%20PTC')
      );
      const json = await response.json();

      // Should decode %20 to space
      expect(mockQuery.mock.calls[0][1]).toEqual(['Zuma PTC']);
      expect(json.store).toBe('Zuma PTC');
    });

    it('should handle store names with special characters', async () => {
      const specialMetrics = { ...metricsRow, store_name: 'Zuma Tunjungan Plaza (TP)' };
      mockQuery
        .mockResolvedValueOnce([specialMetrics])
        .mockResolvedValueOnce(trendRows)
        .mockResolvedValueOnce([coordsRow]);

      const encodedName = encodeURIComponent('Zuma Tunjungan Plaza (TP)');
      const response = await GET(
        makeRequest(`/api/store/${encodedName}`),
        makeParams(encodedName)
      );
      const json = await response.json();

      expect(mockQuery.mock.calls[0][1]).toEqual(['Zuma Tunjungan Plaza (TP)']);
      expect(json.store).toBe('Zuma Tunjungan Plaza (TP)');
    });
  });

  describe('cache behavior', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        store: 'Zuma PTC',
        branch: 'Jatim',
        area: 'Surabaya',
        lat: -7.2756,
        lng: 112.7419,
        city: 'Surabaya',
        revenueToday: 8500000,
        pairsToday: 56,
        aspToday: 151786,
        revenueMtd: 125000000,
        targetMtd: 150000000,
        achievement: 0.83,
        ff: 0.85,
        fa: 0.72,
        fs: 0.61,
        stockPairs: 1200,
        stockValue: 180000000,
        trend: [],
      };
      mockCacheGet.mockReturnValue(cachedData);

      const response = await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );
      const json = await response.json();

      expect(json).toEqual(cachedData);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should use store name in cache key', async () => {
      mockCacheGet.mockReturnValue({ store: 'cached' });

      await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );

      expect(mockCacheGet).toHaveBeenCalledWith('store:Zuma PTC');
    });

    it('should cache DB results on cache miss', async () => {
      mockQuery
        .mockResolvedValueOnce([metricsRow])
        .mockResolvedValueOnce(trendRows)
        .mockResolvedValueOnce([coordsRow]);

      await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );

      expect(mockCacheSet).toHaveBeenCalledTimes(1);
      expect(mockCacheSet).toHaveBeenCalledWith(
        'store:Zuma PTC',
        expect.objectContaining({
          store: 'Zuma PTC',
          branch: 'Jatim',
          revenueToday: 8500000,
        })
      );
    });

    it('should NOT cache 404 responses', async () => {
      mockQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET(
        makeRequest('/api/store/Nonexistent'),
        makeParams('Nonexistent')
      );

      expect(mockCacheSet).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return 500 on DB error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const response = await GET(
        makeRequest('/api/store/Zuma%20PTC'),
        makeParams('Zuma PTC')
      );

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to fetch store details');
    });
  });
});
