import { describe, it, expect, beforeEach } from 'vitest';
import { cache } from '@/lib/cache';

describe('Cache', () => {
  beforeEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should store and retrieve objects', () => {
      const obj = { name: 'test', count: 42 };
      cache.set('obj', obj);
      expect(cache.get('obj')).toEqual(obj);
    });

    it('should store and retrieve arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      cache.set('arr', arr);
      expect(cache.get('arr')).toEqual(arr);
    });

    it('should return null for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should overwrite existing value', () => {
      cache.set('key', 'value1');
      cache.set('key', 'value2');
      expect(cache.get('key')).toBe('value2');
    });
  });

  describe('TTL expiry', () => {
    it('should expire value after TTL', async () => {
      cache.set('expiring', 'value', 100); // 100ms TTL
      expect(cache.get('expiring')).toBe('value');

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.get('expiring')).toBeNull();
    });

    it('should use default TTL (5 minutes)', async () => {
      cache.set('default-ttl', 'value');
      expect(cache.get('default-ttl')).toBe('value');

      // Should still exist after 100ms
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(cache.get('default-ttl')).toBe('value');
    });

    it('should support custom TTL', async () => {
      cache.set('custom-ttl', 'value', 50); // 50ms TTL
      expect(cache.get('custom-ttl')).toBe('value');

      await new Promise((resolve) => setTimeout(resolve, 75));
      expect(cache.get('custom-ttl')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired key', () => {
      cache.set('key', 'value');
      expect(cache.has('key')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      cache.set('expiring', 'value', 50);
      expect(cache.has('expiring')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 75));
      expect(cache.has('expiring')).toBe(false);
    });

    it('should clean up expired entry when checking has()', async () => {
      cache.set('expiring', 'value', 50);
      expect(cache.size()).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 75));
      cache.has('expiring');
      expect(cache.size()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear a specific key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear('key1');
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should clear all keys when no key specified', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });

    it('should handle clearing non-existent key gracefully', () => {
      cache.set('key1', 'value1');
      cache.clear('nonexistent');
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct size after adding entries', () => {
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.set('key3', 'value3');
      expect(cache.size()).toBe(3);
    });

    it('should decrease size after clearing', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.clear('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('type safety', () => {
    it('should preserve types for different data types', () => {
      const str = 'string value';
      const num = 42;
      const bool = true;
      const obj = { a: 1, b: 'test' };

      cache.set('str', str);
      cache.set('num', num);
      cache.set('bool', bool);
      cache.set('obj', obj);

      expect(cache.get<string>('str')).toBe(str);
      expect(cache.get<number>('num')).toBe(num);
      expect(cache.get<boolean>('bool')).toBe(bool);
      expect(cache.get<typeof obj>('obj')).toEqual(obj);
    });
  });
});
