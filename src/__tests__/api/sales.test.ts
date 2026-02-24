import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/sales/route';

// Mock db module
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  queryScalar: vi.fn(),
  getPool: vi.fn(),
  closePool: vi.fn(),
}));

// Mock cache — always miss so tests hit the query path
vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    clear: vi.fn(),
    has: vi.fn().mockReturnValue(false),
  },
}));

import { query } from '@/lib/db';
import { cache } from '@/lib/cache';

const mockQuery = vi.mocked(query);
const mockCacheGet = vi.mocked(cache.get);
const mockCacheSet = vi.mocked(cache.set);

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/sales');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

describe('GET /api/sales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  // ─── view=daily (default) ────────────────────────────────────────────

  describe('view=daily (default)', () => {
    const dailyRows = [
      { report_date: new Date('2026-02-20'), revenue: '5000000', pairs: '50', asp: '100000' },
      { report_date: new Date('2026-02-21'), revenue: '7500000', pairs: '75', asp: '100000' },
      { report_date: new Date('2026-02-22'), revenue: '6000000', pairs: '60', asp: '100000' },
    ];

    it('should return daily revenue array with default params', async () => {
      mockQuery.mockResolvedValueOnce(dailyRows);

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.view).toBe('daily');
      expect(json.data).toHaveLength(3);
      expect(json.data[0]).toEqual({
        date: '2026-02-20',
        revenue: 5000000,
        pairs: 50,
        asp: 100000,
      });
    });

    it('should default to view=daily when no view param', async () => {
      mockQuery.mockResolvedValueOnce(dailyRows);

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(json.view).toBe('daily');
      // Verify SQL uses default 30 days
      expect(mockQuery).toHaveBeenCalledOnce();
      const [sql, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([30]);
      expect(sql).toContain('CURRENT_DATE - $1::integer');
    });

    it('should pass days param to SQL query', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await GET(makeRequest({ days: '7' }));

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([7]);
    });

    it('should pass branch filter to daily SQL', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await GET(makeRequest({ branch: 'Bali' }));

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('AND branch = $2');
      expect(params).toEqual([30, 'Bali']);
    });

    it('should handle null asp when pairs are 0', async () => {
      mockQuery.mockResolvedValueOnce([
        { report_date: '2026-02-22', revenue: '0', pairs: '0', asp: null },
      ]);

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(json.data[0].asp).toBe(0);
    });

    it('should format Date objects to YYYY-MM-DD strings', async () => {
      mockQuery.mockResolvedValueOnce([
        { report_date: new Date('2026-02-22T00:00:00Z'), revenue: '1000', pairs: '10', asp: '100' },
      ]);

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(json.data[0].date).toBe('2026-02-22');
    });

    it('should also handle string dates from pg', async () => {
      mockQuery.mockResolvedValueOnce([
        { report_date: '2026-02-22', revenue: '1000', pairs: '10', asp: '100' },
      ]);

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(json.data[0].date).toBe('2026-02-22');
    });
  });

  // ─── view=mtd ────────────────────────────────────────────────────────

  describe('view=mtd', () => {
    const mtdRows = [
      {
        store_name: 'ZUMA Royal Plaza',
        branch: 'Jatim',
        area: 'Surabaya',
        revenue_mtd: '150000000',
        target_mtd: '200000000',
        achievement_pct: '75.0',
        pairs_today: '25',
      },
      {
        store_name: 'ZUMA Kuta Beach Walk',
        branch: 'Bali',
        area: 'Badung',
        revenue_mtd: '120000000',
        target_mtd: null,
        achievement_pct: null,
        pairs_today: '18',
      },
    ];

    it('should return store-level MTD data', async () => {
      mockQuery.mockResolvedValueOnce(mtdRows);

      const res = await GET(makeRequest({ view: 'mtd' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.view).toBe('mtd');
      expect(json.data).toHaveLength(2);
      expect(json.data[0]).toEqual({
        store: 'ZUMA Royal Plaza',
        branch: 'Jatim',
        area: 'Surabaya',
        revenueMtd: 150000000,
        targetMtd: 200000000,
        achievement: 75.0,
      });
    });

    it('should handle null target and achievement', async () => {
      mockQuery.mockResolvedValueOnce(mtdRows);

      const res = await GET(makeRequest({ view: 'mtd' }));
      const json = await res.json();

      expect(json.data[1].targetMtd).toBeNull();
      expect(json.data[1].achievement).toBeNull();
    });

    it('should filter by branch for MTD view', async () => {
      mockQuery.mockResolvedValueOnce([mtdRows[1]]);

      await GET(makeRequest({ view: 'mtd', branch: 'Bali' }));

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('AND branch = $1');
      expect(params).toEqual(['Bali']);
    });

    it('should not include branch clause when no branch param', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await GET(makeRequest({ view: 'mtd' }));

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).not.toContain('AND branch = $1');
      expect(params).toEqual([]);
    });
  });

  // ─── view=branch ─────────────────────────────────────────────────────

  describe('view=branch', () => {
    const branchRows = [
      { branch: 'Jatim', revenue: '50000000', pairs: '500', avg_achievement: '82.5' },
      { branch: 'Bali', revenue: '45000000', pairs: '450', avg_achievement: '78.3' },
      { branch: 'Jakarta', revenue: '30000000', pairs: '300', avg_achievement: null },
    ];

    it('should return branch-level aggregation', async () => {
      mockQuery.mockResolvedValueOnce(branchRows);

      const res = await GET(makeRequest({ view: 'branch' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.view).toBe('branch');
      expect(json.data).toHaveLength(3);
      expect(json.data[0]).toEqual({
        branch: 'Jatim',
        revenue: 50000000,
        pairs: 500,
        achievement: 82.5,
      });
    });

    it('should handle null achievement', async () => {
      mockQuery.mockResolvedValueOnce(branchRows);

      const res = await GET(makeRequest({ view: 'branch' }));
      const json = await res.json();

      expect(json.data[2].achievement).toBeNull();
    });

    it('should use MAX(report_date) subquery', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await GET(makeRequest({ view: 'branch' }));

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('SELECT MAX(report_date) FROM mart.mv_ops_daily_summary');
      expect(sql).toContain('GROUP BY branch');
    });
  });

  // ─── Validation ──────────────────────────────────────────────────────

  describe('parameter validation', () => {
    it('should reject invalid view parameter', async () => {
      const res = await GET(makeRequest({ view: 'invalid' }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid view');
    });

    it('should reject days < 1', async () => {
      const res = await GET(makeRequest({ days: '0' }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid days');
    });

    it('should reject days > 365', async () => {
      const res = await GET(makeRequest({ days: '999' }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Invalid days');
    });

    it('should reject non-numeric days', async () => {
      const res = await GET(makeRequest({ days: 'abc' }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Invalid days');
    });
  });

  // ─── Caching ─────────────────────────────────────────────────────────

  describe('caching', () => {
    it('should return cached response when available', async () => {
      const cachedResponse = {
        success: true,
        view: 'daily',
        data: [{ date: '2026-02-22', revenue: 1000, pairs: 10, asp: 100 }],
        timestamp: '2026-02-22T10:00:00.000Z',
      };
      mockCacheGet.mockReturnValueOnce(cachedResponse);

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(json).toEqual(cachedResponse);
      // Should NOT call DB
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should store response in cache after DB query', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await GET(makeRequest({ view: 'daily', days: '7' }));

      expect(mockCacheSet).toHaveBeenCalledOnce();
      const [key, value] = mockCacheSet.mock.calls[0];
      expect(key).toBe('sales:daily:all:7');
      expect(value).toHaveProperty('success', true);
      expect(value).toHaveProperty('view', 'daily');
    });

    it('should include branch in cache key when filtered', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await GET(makeRequest({ view: 'mtd', branch: 'Bali' }));

      const [key] = mockCacheSet.mock.calls[0];
      expect(key).toBe('sales:mtd:Bali:30');
    });
  });

  // ─── Error handling ──────────────────────────────────────────────────

  describe('error handling', () => {
    it('should return 500 when DB query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Internal server error');
    });

    it('should include timestamp in error response', async () => {
      mockQuery.mockRejectedValueOnce(new Error('timeout'));

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(json.timestamp).toBeDefined();
      expect(typeof json.timestamp).toBe('string');
    });
  });

  // ─── Response shape ──────────────────────────────────────────────────

  describe('response shape', () => {
    it('should always include success, view, data, timestamp', async () => {
      mockQuery.mockResolvedValueOnce([]);

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(json).toHaveProperty('success');
      expect(json).toHaveProperty('view');
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('timestamp');
    });

    it('should return empty array for no results', async () => {
      mockQuery.mockResolvedValueOnce([]);

      const res = await GET(makeRequest({ view: 'branch' }));
      const json = await res.json();

      expect(json.data).toEqual([]);
    });

    it('should convert pg NUMERIC strings to JS numbers', async () => {
      mockQuery.mockResolvedValueOnce([
        { report_date: '2026-02-22', revenue: '12345678.90', pairs: '123', asp: '100371.37' },
      ]);

      const res = await GET(makeRequest());
      const json = await res.json();

      expect(typeof json.data[0].revenue).toBe('number');
      expect(typeof json.data[0].pairs).toBe('number');
      expect(typeof json.data[0].asp).toBe('number');
    });
  });
});
