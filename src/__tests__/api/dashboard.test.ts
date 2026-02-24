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

import { GET } from '@/app/api/dashboard/route';
import { query } from '@/lib/db';
import { cache } from '@/lib/cache';

const mockQuery = vi.mocked(query);
const mockCacheGet = vi.mocked(cache.get);
const mockCacheSet = vi.mocked(cache.set);

// Sample DB rows returned by hero, branch, and top stores queries
const heroRow = {
  report_date: '2026-02-22',
  total_revenue: '125000000',
  total_pairs: '842',
  avg_achievement: '0.78',
  avg_ff: '0.85',
  avg_fa: '0.72',
  avg_fs: '0.61',
};

const branchRows = [
  { branch: 'Bali', revenue: '45000000', pairs: '310', achievement: '0.82', ff: '0.88' },
  { branch: 'Jatim', revenue: '38000000', pairs: '265', achievement: '0.75', ff: '0.83' },
  { branch: 'Jakarta', revenue: '42000000', pairs: '267', achievement: '0.77', ff: '0.84' },
];

const topStoreRows = [
  { store: 'ZUMA Kuta Beach Walk', branch: 'Bali', revenue: '12000000', achievement: '0.95' },
  { store: 'ZUMA Tunjungan Plaza', branch: 'Jatim', revenue: '10000000', achievement: '0.88' },
  { store: 'ZUMA Grand Indonesia', branch: 'Jakarta', revenue: '9500000', achievement: '0.82' },
  { store: 'ZUMA Discovery Mall', branch: 'Bali', revenue: '9000000', achievement: '0.80' },
  { store: 'ZUMA Galaxy Mall', branch: 'Jatim', revenue: '8500000', achievement: '0.79' },
];

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  describe('cache behavior', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        date: '2026-02-22',
        totalRevenue: 125000000,
        totalPairs: 842,
        avgAchievement: 0.78,
        avgFF: 0.85,
        avgFA: 0.72,
        avgFS: 0.61,
        branches: [],
        topStores: [],
      };
      mockCacheGet.mockReturnValue(cachedData);

      const response = await GET(makeRequest('/api/dashboard'));
      const json = await response.json();

      expect(json).toEqual(cachedData);
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockCacheGet).toHaveBeenCalledWith('dashboard:null:null');
    });

    it('should use branch and date in cache key', async () => {
      mockCacheGet.mockReturnValue({ date: '2026-02-20' });

      await GET(makeRequest('/api/dashboard?branch=Bali&date=2026-02-20'));

      expect(mockCacheGet).toHaveBeenCalledWith('dashboard:Bali:2026-02-20');
    });

    it('should cache DB results on cache miss', async () => {
      mockQuery
        .mockResolvedValueOnce([heroRow])
        .mockResolvedValueOnce(branchRows)
        .mockResolvedValueOnce(topStoreRows);

      await GET(makeRequest('/api/dashboard'));

      expect(mockCacheSet).toHaveBeenCalledTimes(1);
      expect(mockCacheSet).toHaveBeenCalledWith(
        'dashboard:null:null',
        expect.objectContaining({
          date: '2026-02-22',
          totalRevenue: 125000000,
        })
      );
    });
  });

  describe('DB queries on cache miss', () => {
    it('should query DB and return formatted response', async () => {
      mockQuery
        .mockResolvedValueOnce([heroRow])
        .mockResolvedValueOnce(branchRows)
        .mockResolvedValueOnce(topStoreRows);

      const response = await GET(makeRequest('/api/dashboard'));
      const json = await response.json();

      expect(json.date).toBe('2026-02-22');
      expect(json.totalRevenue).toBe(125000000);
      expect(json.totalPairs).toBe(842);
      expect(json.avgAchievement).toBe(0.78);
      expect(json.avgFF).toBe(0.85);
      expect(json.avgFA).toBe(0.72);
      expect(json.avgFS).toBe(0.61);
      expect(json.branches).toHaveLength(3);
      expect(json.branches[0].branch).toBe('Bali');
      expect(json.branches[0].revenue).toBe(45000000);
      expect(json.topStores).toHaveLength(5);
      expect(json.topStores[0].store).toBe('ZUMA Kuta Beach Walk');
    });

    it('should execute 3 parallel queries', async () => {
      mockQuery
        .mockResolvedValueOnce([heroRow])
        .mockResolvedValueOnce(branchRows)
        .mockResolvedValueOnce(topStoreRows);

      await GET(makeRequest('/api/dashboard'));

      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should use MAX(report_date) when no date param', async () => {
      mockQuery
        .mockResolvedValueOnce([heroRow])
        .mockResolvedValueOnce(branchRows)
        .mockResolvedValueOnce(topStoreRows);

      await GET(makeRequest('/api/dashboard'));

      // All 3 queries should contain the subquery for MAX date
      const heroCall = mockQuery.mock.calls[0][0] as string;
      expect(heroCall).toContain('SELECT MAX(report_date)');
      // No params for date filter
      expect(mockQuery.mock.calls[0][1]).toEqual([]);
    });
  });

  describe('branch filter', () => {
    it('should apply branch filter in SQL when provided', async () => {
      mockQuery
        .mockResolvedValueOnce([heroRow])
        .mockResolvedValueOnce([branchRows[0]])
        .mockResolvedValueOnce(topStoreRows.slice(0, 2));

      await GET(makeRequest('/api/dashboard?branch=Bali'));

      // All 3 queries should have branch param
      expect(mockQuery.mock.calls[0][1]).toEqual(['Bali']);
      expect(mockQuery.mock.calls[1][1]).toEqual(['Bali']);
      expect(mockQuery.mock.calls[2][1]).toEqual(['Bali']);

      // SQL should contain branch = $1
      const heroSql = mockQuery.mock.calls[0][0] as string;
      expect(heroSql).toContain('branch = $1');
    });

    it('should apply both date and branch filters', async () => {
      mockQuery
        .mockResolvedValueOnce([heroRow])
        .mockResolvedValueOnce(branchRows)
        .mockResolvedValueOnce(topStoreRows);

      await GET(makeRequest('/api/dashboard?branch=Bali&date=2026-02-20'));

      // date = $1, branch = $2
      expect(mockQuery.mock.calls[0][1]).toEqual(['2026-02-20', 'Bali']);

      const heroSql = mockQuery.mock.calls[0][0] as string;
      expect(heroSql).toContain('report_date = $1');
      expect(heroSql).toContain('branch = $2');
    });
  });

  describe('empty results', () => {
    it('should handle empty result gracefully', async () => {
      mockQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET(makeRequest('/api/dashboard'));
      const json = await response.json();

      expect(json.totalRevenue).toBe(0);
      expect(json.totalPairs).toBe(0);
      expect(json.avgAchievement).toBeNull();
      expect(json.avgFF).toBeNull();
      expect(json.avgFA).toBeNull();
      expect(json.avgFS).toBeNull();
      expect(json.branches).toEqual([]);
      expect(json.topStores).toEqual([]);
    });

    it('should use requested date in empty response', async () => {
      mockQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET(makeRequest('/api/dashboard?date=2026-01-01'));
      const json = await response.json();

      expect(json.date).toBe('2026-01-01');
    });

    it('should cache empty results too', async () => {
      mockQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await GET(makeRequest('/api/dashboard'));

      expect(mockCacheSet).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should return 500 on DB error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const response = await GET(makeRequest('/api/dashboard'));

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to fetch dashboard metrics');
    });
  });

  describe('numeric conversions', () => {
    it('should convert PostgreSQL numeric strings to numbers', async () => {
      mockQuery
        .mockResolvedValueOnce([heroRow])
        .mockResolvedValueOnce(branchRows)
        .mockResolvedValueOnce(topStoreRows);

      const response = await GET(makeRequest('/api/dashboard'));
      const json = await response.json();

      // Revenue should be number, not string
      expect(typeof json.totalRevenue).toBe('number');
      expect(typeof json.totalPairs).toBe('number');
      expect(typeof json.avgAchievement).toBe('number');
      expect(typeof json.branches[0].revenue).toBe('number');
      expect(typeof json.topStores[0].revenue).toBe('number');
    });

    it('should handle null metric values', async () => {
      const heroWithNulls = {
        ...heroRow,
        avg_achievement: null,
        avg_ff: null,
        avg_fa: null,
        avg_fs: null,
      };
      mockQuery
        .mockResolvedValueOnce([heroWithNulls])
        .mockResolvedValueOnce([{ branch: 'Bali', revenue: '10000', pairs: '5', achievement: null, ff: null }])
        .mockResolvedValueOnce([{ store: 'Test Store', branch: 'Bali', revenue: '5000', achievement: null }]);

      const response = await GET(makeRequest('/api/dashboard'));
      const json = await response.json();

      expect(json.avgAchievement).toBeNull();
      expect(json.avgFF).toBeNull();
      expect(json.avgFA).toBeNull();
      expect(json.avgFS).toBeNull();
      expect(json.branches[0].achievement).toBeNull();
      expect(json.branches[0].ff).toBeNull();
      expect(json.topStores[0].achievement).toBeNull();
    });
  });
});
