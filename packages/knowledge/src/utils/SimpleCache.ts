/**
 * Simple TTL cache implementation
 * Extracted from SearchServiceOGM to eliminate code duplication
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Generic cache implementation with TTL and size limits
 * Replaces the inline SearchCache class that was duplicated in SearchServiceOGM
 */
export class SimpleCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.ttl = options.ttl ?? 300000; // 5 minutes default
  }

  /**
   * Generates a consistent cache key from an object
   */
  private generateKey(obj: any): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  /**
   * Gets a cached value if it exists and hasn't expired
   */
  get(key: any): T | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Sets a value in the cache with current timestamp
   */
  set(key: any, value: T): void {
    const cacheKey = this.generateKey(key);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      data: value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clears all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidates cache entries matching a pattern
   */
  invalidate(pattern?: (key: string) => boolean): void {
    if (!pattern) {
      this.clear();
      return;
    }

    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (pattern(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gets current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Gets cache statistics
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}