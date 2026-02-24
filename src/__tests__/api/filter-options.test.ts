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

import { GET } from '@/app/api/filter-options/route';
import { query, queryScalar } from '@/lib/db';
import { cache } from '@/lib/cache';

const mockQuery = vi.mocked(query);
const mockQueryScalar = vi.mocked(queryScalar);
const mockCacheGet = vi.mocked(cache.get);
const mockCacheSet = vi.mocked(cache.set);

// Sample DB rows
const branchRows = [{ branch: 'Bali' }, { branch: 'Jakarta' }, { branch: 'Jatim' }];
const areaRows = [{ area: 'Denpasar' }, { area: 'Kuta' }, { area: 'Surabaya' }];
const categoryRows = [{ store_category: 'RETAIL' }, { store_category: 'NON-RETAIL' }];
const storeRows = [
  { store_name: 'ZUMA Discovery Mall' },
  { store_name: 'ZUMA Grand Indonesia' },
  { store_name: 'ZUMA Kuta Beach Walk' },
];

function mockAllQueries() {
  mockQuery
    .mockResolvedValueOnce(branchRows)   // branches
    .mockResolvedValueOnce(areaRows)     // areas
    .mockResolvedValueOnce(categoryRows) // categories
    .mockResolvedValueOnce(storeRows);   // stores
  mockQueryScalar.mockResolvedValueOnce('2026-02-22');
}

describe('GET /api/filter-options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  describe('cache behavior', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        branches: ['Bali', 'Jakarta'],
        areas: ['Denpasar'],
        categories: ['RETAIL'],
        stores: ['ZUMA Kuta Beach Walk'],
        latestDate: '2026-02-22',
      };
      mockCacheGet.mockReturnValue(cachedData);

      const response = await GET();
      const json = await response.json();

      expect(json).toEqual(cachedData);
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockQueryScalar).not.toHaveBeenCalled();
      expect(mockCacheGet).toHaveBeenCalledWith('filter-options');
    });

    it('should cache DB results on cache miss', async () => {
      mockAllQueries();

      await GET();

      expect(mockCacheSet).toHaveBeenCalledTimes(1);
      expect(mockCacheSet).toHaveBeenCalledWith(
        'filter-options',
        expect.objectContaining({
          branches: ['Bali', 'Jakarta', 'Jatim'],
          latestDate: '2026-02-22',
        })
      );
    });
  });

  describe('DB queries on cache miss', () => {
    it('should return all 4 filter arrays plus latestDate', async () => {
      mockAllQueries();

      const response = await GET();
      const json = await response.json();

      expect(json.branches).toEqual(['Bali', 'Jakarta', 'Jatim']);
      expect(json.areas).toEqual(['Denpasar', 'Kuta', 'Surabaya']);
      expect(json.categories).toEqual(['RETAIL', 'NON-RETAIL']);
      expect(json.stores).toEqual([
        'ZUMA Discovery Mall',
        'ZUMA Grand Indonesia',
        'ZUMA Kuta Beach Walk',
      ]);
      expect(json.latestDate).toBe('2026-02-22');
    });

    it('should execute 4 queries + 1 scalar in parallel', async () => {
      mockAllQueries();

      await GET();

      expect(mockQuery).toHaveBeenCalledTimes(4);
      expect(mockQueryScalar).toHaveBeenCalledTimes(1);
    });

    it('should query distinct branches from mv_ops_daily_summary', async () => {
      mockAllQueries();

      await GET();

      const branchSql = mockQuery.mock.calls[0][0] as string;
      expect(branchSql).toContain('DISTINCT branch');
      expect(branchSql).toContain('mart.mv_ops_daily_summary');
      expect(branchSql).toContain('branch IS NOT NULL');
    });

    it('should query distinct areas from mv_ops_daily_summary', async () => {
      mockAllQueries();

      await GET();

      const areaSql = mockQuery.mock.calls[1][0] as string;
      expect(areaSql).toContain('DISTINCT area');
      expect(areaSql).toContain('area IS NOT NULL');
    });

    it('should query distinct store_category from mv_ops_daily_summary', async () => {
      mockAllQueries();

      await GET();

      const categorySql = mockQuery.mock.calls[2][0] as string;
      expect(categorySql).toContain('DISTINCT store_category');
      expect(categorySql).toContain('store_category IS NOT NULL');
    });

    it('should query stores for latest date only', async () => {
      mockAllQueries();

      await GET();

      const storeSql = mockQuery.mock.calls[3][0] as string;
      expect(storeSql).toContain('DISTINCT store_name');
      expect(storeSql).toContain('MAX(report_date)');
    });

    it('should handle empty results (no data in mv_ops_daily_summary)', async () => {
      mockQuery
        .mockResolvedValueOnce([])  // branches
        .mockResolvedValueOnce([])  // areas
        .mockResolvedValueOnce([])  // categories
        .mockResolvedValueOnce([]); // stores
      mockQueryScalar.mockResolvedValueOnce(null);

      const response = await GET();
      const json = await response.json();

      expect(json.branches).toEqual([]);
      expect(json.areas).toEqual([]);
      expect(json.categories).toEqual([]);
      expect(json.stores).toEqual([]);
      // Should fallback to today's date when no data
      expect(json.latestDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('response types', () => {
    it('should return string arrays for all filter options', async () => {
      mockAllQueries();

      const response = await GET();
      const json = await response.json();

      expect(Array.isArray(json.branches)).toBe(true);
      expect(Array.isArray(json.areas)).toBe(true);
      expect(Array.isArray(json.categories)).toBe(true);
      expect(Array.isArray(json.stores)).toBe(true);
      expect(typeof json.latestDate).toBe('string');

      // All entries should be strings
      for (const b of json.branches) { expect(typeof b).toBe('string'); }
      for (const a of json.areas) { expect(typeof a).toBe('string'); }
      for (const c of json.categories) { expect(typeof c).toBe('string'); }
      for (const s of json.stores) { expect(typeof s).toBe('string'); }
    });
  });

  describe('error handling', () => {
    it('should return 500 on DB error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const response = await GET();

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to fetch filter options');
    });
  });
});
