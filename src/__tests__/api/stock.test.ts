import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/stock/route';
import { cache } from '@/lib/cache';
import { NextRequest } from 'next/server';

// Mock the db module
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

import { query } from '@/lib/db';
const mockQuery = vi.mocked(query);

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/stock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
  });

  describe('view=summary (default)', () => {
    const summaryRow = {
      total_stock_pairs: '125000',
      total_stock_value: '8500000000',
      avg_ff: '0.72',
      avg_fa: '0.65',
      avg_fs: '0.68',
      store_count: '45',
    };

    it('should return aggregate stock metrics', async () => {
      mockQuery.mockResolvedValueOnce([summaryRow]);

      const res = await GET(makeRequest('/api/stock'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.view).toBe('summary');
      expect(body.data[0]).toEqual({
        totalStockPairs: 125000,
        totalStockValue: 8500000000,
        avgFF: 0.72,
        avgFA: 0.65,
        avgFS: 0.68,
        storeCount: 45,
      });
      expect(body.cached).toBe(false);
    });

    it('should return summary by default when no view param', async () => {
      mockQuery.mockResolvedValueOnce([summaryRow]);

      const res = await GET(makeRequest('/api/stock'));
      const body = await res.json();

      expect(body.view).toBe('summary');
    });

    it('should handle NULL aggregates gracefully', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          total_stock_pairs: null,
          total_stock_value: null,
          avg_ff: null,
          avg_fa: null,
          avg_fs: null,
          store_count: '0',
        },
      ]);

      const res = await GET(makeRequest('/api/stock?view=summary'));
      const body = await res.json();

      expect(body.data[0].totalStockPairs).toBe(0);
      expect(body.data[0].totalStockValue).toBe(0);
      expect(body.data[0].avgFF).toBe(0);
      expect(body.data[0].avgFA).toBe(0);
      expect(body.data[0].avgFS).toBe(0);
    });

    it('should handle empty result set', async () => {
      mockQuery.mockResolvedValueOnce([]);

      const res = await GET(makeRequest('/api/stock?view=summary'));
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data[0].totalStockPairs).toBe(0);
      expect(body.data[0].storeCount).toBe(0);
    });
  });

  describe('view=ff', () => {
    const trendRows = [
      { report_date: '2026-02-01', avg_ff: '0.70', avg_fa: '0.62', avg_fs: '0.66' },
      { report_date: '2026-02-02', avg_ff: '0.71', avg_fa: '0.63', avg_fs: '0.67' },
      { report_date: '2026-02-03', avg_ff: '0.73', avg_fa: '0.65', avg_fs: '0.69' },
    ];

    it('should return FF/FA/FS time series', async () => {
      mockQuery.mockResolvedValueOnce(trendRows);

      const res = await GET(makeRequest('/api/stock?view=ff'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.view).toBe('ff');
      expect(body.data).toHaveLength(3);
      expect(body.data[0]).toEqual({
        date: '2026-02-01',
        avgFF: 0.70,
        avgFA: 0.62,
        avgFS: 0.66,
      });
      expect(body.data[2]).toEqual({
        date: '2026-02-03',
        avgFF: 0.73,
        avgFA: 0.65,
        avgFS: 0.69,
      });
    });

    it('should return empty array when no trend data', async () => {
      mockQuery.mockResolvedValueOnce([]);

      const res = await GET(makeRequest('/api/stock?view=ff'));
      const body = await res.json();

      expect(body.view).toBe('ff');
      expect(body.data).toEqual([]);
    });

    it('should handle null FF/FA/FS values in trend', async () => {
      mockQuery.mockResolvedValueOnce([
        { report_date: '2026-02-01', avg_ff: null, avg_fa: '0.62', avg_fs: null },
      ]);

      const res = await GET(makeRequest('/api/stock?view=ff'));
      const body = await res.json();

      expect(body.data[0].avgFF).toBe(0);
      expect(body.data[0].avgFA).toBe(0.62);
      expect(body.data[0].avgFS).toBe(0);
    });
  });

  describe('view=stores', () => {
    const storeRows = [
      {
        store_name: 'ZUMA Royal Plaza',
        branch: 'Jatim',
        area: 'Surabaya',
        stock_pairs: '3200',
        stock_value: '450000000',
        ff_pct: '0.55',
        fa_pct: '0.48',
        fs_pct: '0.51',
        turnover_ratio: '2.3',
      },
      {
        store_name: 'ZUMA Kuta',
        branch: 'Bali',
        area: 'Badung',
        stock_pairs: '2800',
        stock_value: '390000000',
        ff_pct: '0.82',
        fa_pct: '0.78',
        fs_pct: '0.80',
        turnover_ratio: '1.5',
      },
    ];

    it('should return per-store stock + FF data', async () => {
      mockQuery.mockResolvedValueOnce(storeRows);

      const res = await GET(makeRequest('/api/stock?view=stores'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.view).toBe('stores');
      expect(body.data).toHaveLength(2);
      expect(body.data[0]).toEqual({
        store: 'ZUMA Royal Plaza',
        branch: 'Jatim',
        stockPairs: 3200,
        stockValue: 450000000,
        ff: 0.55,
        fa: 0.48,
        fs: 0.51,
        turnover: 2.3,
      });
    });

    it('should handle null metrics for stores', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          store_name: 'New Store',
          branch: 'Jakarta',
          area: 'Central',
          stock_pairs: '500',
          stock_value: '75000000',
          ff_pct: null,
          fa_pct: null,
          fs_pct: null,
          turnover_ratio: null,
        },
      ]);

      const res = await GET(makeRequest('/api/stock?view=stores'));
      const body = await res.json();

      expect(body.data[0].ff).toBeNull();
      expect(body.data[0].fa).toBeNull();
      expect(body.data[0].fs).toBeNull();
      expect(body.data[0].turnover).toBeNull();
    });
  });

  describe('branch filter', () => {
    it('should pass branch parameter to summary query', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          total_stock_pairs: '25000',
          total_stock_value: '1700000000',
          avg_ff: '0.80',
          avg_fa: '0.75',
          avg_fs: '0.77',
          store_count: '8',
        },
      ]);

      const res = await GET(makeRequest('/api/stock?branch=Bali'));
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data[0].storeCount).toBe(8);

      // Verify SQL received branch param
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(params).toEqual(['Bali']);
      expect(sql).toContain('branch = $1');
    });

    it('should pass branch parameter to ff query', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await GET(makeRequest('/api/stock?view=ff&branch=Jakarta'));

      const [sql, params] = mockQuery.mock.calls[0];
      expect(params).toEqual(['Jakarta']);
      expect(sql).toContain('branch = $1');
    });

    it('should pass branch parameter to stores query', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await GET(makeRequest('/api/stock?view=stores&branch=Jatim'));

      const [sql, params] = mockQuery.mock.calls[0];
      expect(params).toEqual(['Jatim']);
      expect(sql).toContain('branch = $1');
    });

    it('should NOT include branch clause when no branch param', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          total_stock_pairs: '100000',
          total_stock_value: '7000000000',
          avg_ff: '0.70',
          avg_fa: '0.63',
          avg_fs: '0.66',
          store_count: '45',
        },
      ]);

      await GET(makeRequest('/api/stock'));

      const [sql, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([]);
      expect(sql).not.toContain('branch = $');
    });
  });

  describe('caching', () => {
    it('should cache results and return cached on second call', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          total_stock_pairs: '100000',
          total_stock_value: '7000000000',
          avg_ff: '0.70',
          avg_fa: '0.63',
          avg_fs: '0.66',
          store_count: '45',
        },
      ]);

      // First call - from DB
      const res1 = await GET(makeRequest('/api/stock'));
      const body1 = await res1.json();
      expect(body1.cached).toBe(false);
      expect(mockQuery).toHaveBeenCalledTimes(1);

      // Second call - from cache
      const res2 = await GET(makeRequest('/api/stock'));
      const body2 = await res2.json();
      expect(body2.cached).toBe(true);
      expect(body2.data).toEqual(body1.data);
      expect(mockQuery).toHaveBeenCalledTimes(1); // Still 1, no new DB call
    });

    it('should use different cache keys for different views', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            total_stock_pairs: '100000',
            total_stock_value: '7000000000',
            avg_ff: '0.70',
            avg_fa: '0.63',
            avg_fs: '0.66',
            store_count: '45',
          },
        ])
        .mockResolvedValueOnce([]);

      await GET(makeRequest('/api/stock?view=summary'));
      await GET(makeRequest('/api/stock?view=ff'));

      expect(mockQuery).toHaveBeenCalledTimes(2); // Both hit DB
    });

    it('should use different cache keys for different branches', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            total_stock_pairs: '25000',
            total_stock_value: '1700000000',
            avg_ff: '0.80',
            avg_fa: '0.75',
            avg_fs: '0.77',
            store_count: '8',
          },
        ])
        .mockResolvedValueOnce([
          {
            total_stock_pairs: '30000',
            total_stock_value: '2000000000',
            avg_ff: '0.65',
            avg_fa: '0.60',
            avg_fs: '0.62',
            store_count: '12',
          },
        ]);

      await GET(makeRequest('/api/stock?branch=Bali'));
      await GET(makeRequest('/api/stock?branch=Jatim'));

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should return 400 for invalid view parameter', async () => {
      const res = await GET(makeRequest('/api/stock?view=invalid'));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid view');
    });

    it('should return mock data on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const res = await GET(makeRequest('/api/stock'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body._mock).toBe(true);
      expect(body.data).toBeDefined();
    });

    it('should include timestamp in all responses', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          total_stock_pairs: '100',
          total_stock_value: '5000',
          avg_ff: '0.5',
          avg_fa: '0.5',
          avg_fs: '0.5',
          store_count: '1',
        },
      ]);

      const res = await GET(makeRequest('/api/stock'));
      const body = await res.json();

      expect(body.timestamp).toBeDefined();
      expect(() => new Date(body.timestamp)).not.toThrow();
    });

    it('should include timestamp in error responses', async () => {
      const res = await GET(makeRequest('/api/stock?view=bad'));
      const body = await res.json();

      expect(body.timestamp).toBeDefined();
    });
  });
});
