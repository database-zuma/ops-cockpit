/**
 * In-memory cache entry with TTL support
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL (Time To Live) support
 * Default TTL: 5 minutes
 */
class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get a value from cache if it exists and hasn't expired
   * @param key - Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in cache with optional TTL
   * @param key - Cache key
   * @param data - Value to cache
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.store.set(key, { data, expiresAt });
  }

  /**
   * Check if a key exists in cache and hasn't expired
   * @param key - Cache key
   * @returns true if key exists and is valid, false otherwise
   */
  has(key: string): boolean {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear a specific key or all keys
   * @param key - Optional cache key to clear. If not provided, clears all.
   */
  clear(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }

  /**
   * Get cache size (number of entries, including expired)
   * @returns Number of entries in cache
   */
  size(): number {
    return this.store.size;
  }
}

// Export singleton instance
export const cache = new Cache();
