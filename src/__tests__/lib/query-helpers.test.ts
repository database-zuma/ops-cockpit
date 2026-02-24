import { describe, it, expect } from 'vitest';
import {
  buildWhereClause,
  buildWhereClauseWithKeyword,
  buildOrderBy,
  buildLimit,
  QueryFilters,
} from '@/lib/query-helpers';

describe('Query Helpers', () => {
  describe('buildWhereClause', () => {
    it('should return empty where clause for empty filters', () => {
      const result = buildWhereClause({});
      expect(result.where).toBe('');
      expect(result.params).toEqual([]);
      expect(result.paramIndex).toBe(1);
    });

    it('should build where clause for single branch filter', () => {
      const result = buildWhereClause({ branch: 'Bali' });
      expect(result.where).toBe('branch = $1');
      expect(result.params).toEqual(['Bali']);
      expect(result.paramIndex).toBe(2);
    });

    it('should build where clause for multiple filters', () => {
      const filters: QueryFilters = {
        branch: 'Bali',
        area: 'Denpasar',
        store: 'ZUMA Bali',
      };
      const result = buildWhereClause(filters);
      expect(result.where).toBe('branch = $1 AND area = $2 AND store_name = $3');
      expect(result.params).toEqual(['Bali', 'Denpasar', 'ZUMA Bali']);
      expect(result.paramIndex).toBe(4);
    });

    it('should support table alias', () => {
      const result = buildWhereClause({ branch: 'Bali' }, 's');
      expect(result.where).toBe('s.branch = $1');
      expect(result.params).toEqual(['Bali']);
    });

    it('should handle date filters', () => {
      const filters: QueryFilters = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      const result = buildWhereClause(filters);
      expect(result.where).toBe('report_date >= $1 AND report_date <= $2');
      expect(result.params).toEqual(['2026-01-01', '2026-01-31']);
    });

    it('should handle store category filter', () => {
      const result = buildWhereClause({ storeCategory: 'RETAIL' });
      expect(result.where).toBe('store_category = $1');
      expect(result.params).toEqual(['RETAIL']);
    });

    it('should handle all filters together', () => {
      const filters: QueryFilters = {
        branch: 'Bali',
        area: 'Denpasar',
        store: 'ZUMA Bali',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        storeCategory: 'RETAIL',
      };
      const result = buildWhereClause(filters, 's');
      expect(result.where).toBe(
        's.branch = $1 AND s.area = $2 AND s.store_name = $3 AND s.report_date >= $4 AND s.report_date <= $5 AND s.store_category = $6'
      );
      expect(result.params).toEqual([
        'Bali',
        'Denpasar',
        'ZUMA Bali',
        '2026-01-01',
        '2026-01-31',
        'RETAIL',
      ]);
      expect(result.paramIndex).toBe(7);
    });

    it('should skip undefined filters', () => {
      const filters: QueryFilters = {
        branch: 'Bali',
        area: undefined,
        store: 'ZUMA Bali',
      };
      const result = buildWhereClause(filters);
      expect(result.where).toBe('branch = $1 AND store_name = $2');
      expect(result.params).toEqual(['Bali', 'ZUMA Bali']);
    });

    it('should handle empty string filters as falsy', () => {
      const filters: QueryFilters = {
        branch: 'Bali',
        area: '',
        store: 'ZUMA Bali',
      };
      const result = buildWhereClause(filters);
      expect(result.where).toBe('branch = $1 AND store_name = $2');
      expect(result.params).toEqual(['Bali', 'ZUMA Bali']);
    });
  });

  describe('buildWhereClauseWithKeyword', () => {
    it('should return empty string for empty filters', () => {
      const result = buildWhereClauseWithKeyword({});
      expect(result.where).toBe('');
      expect(result.params).toEqual([]);
    });

    it('should include WHERE keyword when filters exist', () => {
      const result = buildWhereClauseWithKeyword({ branch: 'Bali' });
      expect(result.where).toBe('WHERE branch = $1');
      expect(result.params).toEqual(['Bali']);
    });

    it('should include WHERE keyword with multiple filters', () => {
      const filters: QueryFilters = {
        branch: 'Bali',
        area: 'Denpasar',
      };
      const result = buildWhereClauseWithKeyword(filters);
      expect(result.where).toBe('WHERE branch = $1 AND area = $2');
      expect(result.params).toEqual(['Bali', 'Denpasar']);
    });

    it('should support table alias with WHERE keyword', () => {
      const result = buildWhereClauseWithKeyword({ branch: 'Bali' }, 's');
      expect(result.where).toBe('WHERE s.branch = $1');
      expect(result.params).toEqual(['Bali']);
    });
  });

  describe('buildOrderBy', () => {
    it('should build ORDER BY with default ASC', () => {
      const result = buildOrderBy('report_date');
      expect(result).toBe('ORDER BY report_date ASC');
    });

    it('should build ORDER BY with DESC', () => {
      const result = buildOrderBy('report_date', 'DESC');
      expect(result).toBe('ORDER BY report_date DESC');
    });

    it('should support table alias', () => {
      const result = buildOrderBy('report_date', 'DESC', 's');
      expect(result).toBe('ORDER BY s.report_date DESC');
    });

    it('should work with different column names', () => {
      expect(buildOrderBy('store_name')).toBe('ORDER BY store_name ASC');
      expect(buildOrderBy('revenue_today', 'DESC')).toBe(
        'ORDER BY revenue_today DESC'
      );
    });
  });

  describe('buildLimit', () => {
    it('should build LIMIT clause without offset', () => {
      const result = buildLimit(10);
      expect(result).toBe('LIMIT 10');
    });

    it('should build LIMIT clause with offset', () => {
      const result = buildLimit(10, 20);
      expect(result).toBe('LIMIT 10 OFFSET 20');
    });

    it('should ignore offset if 0', () => {
      const result = buildLimit(10, 0);
      expect(result).toBe('LIMIT 10');
    });

    it('should handle large limits', () => {
      const result = buildLimit(1000, 5000);
      expect(result).toBe('LIMIT 1000 OFFSET 5000');
    });
  });

  describe('integration scenarios', () => {
    it('should build complete query with all helpers', () => {
      const filters: QueryFilters = {
        branch: 'Bali',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };

      const whereResult = buildWhereClauseWithKeyword(filters, 's');
      const orderBy = buildOrderBy('report_date', 'DESC', 's');
      const limit = buildLimit(50, 0);

      const query = `SELECT * FROM ops_daily s ${whereResult.where} ${orderBy} ${limit}`;

      expect(query).toBe(
        'SELECT * FROM ops_daily s WHERE s.branch = $1 AND s.report_date >= $2 AND s.report_date <= $3 ORDER BY s.report_date DESC LIMIT 50'
      );
      expect(whereResult.params).toEqual(['Bali', '2026-01-01', '2026-01-31']);
    });

    it('should handle pagination scenario', () => {
      const pageSize = 20;
      const page = 3;
      const offset = (page - 1) * pageSize;

      const limit = buildLimit(pageSize, offset);
      expect(limit).toBe('LIMIT 20 OFFSET 40');
    });
  });
});
