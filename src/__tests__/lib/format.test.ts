import { describe, it, expect } from 'vitest';
import {
  formatIDR,
  formatPct,
  formatCompact,
  formatPairs,
  formatDelta,
} from '@/lib/format';

describe('format utilities', () => {
  describe('formatIDR', () => {
    it('formats full IDR currency', () => {
      const result1 = formatIDR(1500000);
      expect(result1).toMatch(/^Rp\s+1\.500\.000$/);
      const result2 = formatIDR(1000);
      expect(result2).toMatch(/^Rp\s+1\.000$/);
      const result3 = formatIDR(0);
      expect(result3).toMatch(/^Rp\s+0$/);
    });

    it('formats compact IDR currency', () => {
      expect(formatIDR(1500000, true)).toBe('Rp 1,5 jt');
      expect(formatIDR(1000000, true)).toBe('Rp 1 jt');
      expect(formatIDR(5000, true)).toBe('Rp 5 rb');
      expect(formatIDR(1000000000, true)).toBe('Rp 1 M');
      expect(formatIDR(1500000000, true)).toBe('Rp 1,5 M');
    });

    it('handles negative values', () => {
      expect(formatIDR(-1500000, true)).toBe('-Rp 1,5 jt');
      expect(formatIDR(-5000, true)).toBe('-Rp 5 rb');
    });

    it('handles small values', () => {
      expect(formatIDR(100, true)).toBe('Rp 100');
      expect(formatIDR(999, true)).toBe('Rp 999');
    });
  });

  describe('formatPct', () => {
    it('formats decimal fractions as percentages', () => {
      expect(formatPct(0.75)).toBe('75,0%');
      expect(formatPct(0.5)).toBe('50,0%');
      expect(formatPct(0.333)).toBe('33,3%');
    });

    it('formats integer percentages', () => {
      expect(formatPct(75)).toBe('75,0%');
      expect(formatPct(50)).toBe('50,0%');
    });

    it('respects decimal places parameter', () => {
      expect(formatPct(0.75, 0)).toBe('75%');
      expect(formatPct(0.75, 2)).toBe('75,00%');
      expect(formatPct(0.333, 2)).toBe('33,30%');
    });

    it('handles zero', () => {
      expect(formatPct(0)).toBe('0,0%');
    });

    it('handles values > 1', () => {
      expect(formatPct(1.5)).toBe('1,5%');
      expect(formatPct(150)).toBe('150,0%');
    });
  });

  describe('formatCompact', () => {
    it('formats millions', () => {
      expect(formatCompact(1500000)).toBe('1,5jt');
      expect(formatCompact(1000000)).toBe('1jt');
      expect(formatCompact(5000000)).toBe('5jt');
    });

    it('formats thousands', () => {
      expect(formatCompact(5000)).toBe('5rb');
      expect(formatCompact(1000)).toBe('1rb');
      expect(formatCompact(1500)).toBe('1,5rb');
    });

    it('formats billions', () => {
      expect(formatCompact(1000000000)).toBe('1M');
      expect(formatCompact(1500000000)).toBe('1,5M');
    });

    it('handles small values', () => {
      expect(formatCompact(100)).toBe('100');
      expect(formatCompact(999)).toBe('999');
    });

    it('handles negative values', () => {
      expect(formatCompact(-1500000)).toBe('-1,5jt');
      expect(formatCompact(-5000)).toBe('-5rb');
    });

    it('handles zero', () => {
      expect(formatCompact(0)).toBe('0');
    });
  });

  describe('formatPairs', () => {
    it('formats pairs count with psg suffix', () => {
      expect(formatPairs(1234)).toBe('1.234 psg');
      expect(formatPairs(1000)).toBe('1.000 psg');
      expect(formatPairs(100)).toBe('100 psg');
    });

    it('uses Indonesian number formatting', () => {
      expect(formatPairs(1000000)).toBe('1.000.000 psg');
    });

    it('handles zero', () => {
      expect(formatPairs(0)).toBe('0 psg');
    });
  });

  describe('formatDelta', () => {
    it('formats positive delta with plus sign', () => {
      expect(formatDelta(5.2)).toBe('+5,2%');
      expect(formatDelta(0.05)).toBe('+5,0%');
    });

    it('formats negative delta with minus sign', () => {
      expect(formatDelta(-3.1)).toBe('-3,1%');
      expect(formatDelta(-0.031)).toBe('-3,1%');
    });

    it('formats zero delta', () => {
      expect(formatDelta(0)).toBe('0,0%');
    });

    it('respects decimal places parameter', () => {
      expect(formatDelta(5.2, 0)).toBe('+5%');
      expect(formatDelta(5.2, 2)).toBe('+5,20%');
      expect(formatDelta(-3.1, 2)).toBe('-3,10%');
    });

    it('handles decimal fractions', () => {
      expect(formatDelta(0.052)).toBe('+5,2%');
      expect(formatDelta(-0.031)).toBe('-3,1%');
    });

    it('handles large values', () => {
      expect(formatDelta(150)).toBe('+150,0%');
      expect(formatDelta(-200)).toBe('-200,0%');
    });
  });
});
