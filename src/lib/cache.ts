/**
 * Lightweight in-memory TTL cache to reduce external API latency
 * and protect against third-party rate limits.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory key-value cache with Time-To-Live expiration and capacity bounding.
 */
export class MemoryTTLCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries = 200;

  /**
   * Retrieves an item from cache if present and not expired.
   *
   * @param key - Unique cache key identifier
   * @returns Cached value of type T or null if missing or expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /**
   * Stores a value in cache with a defined Time-To-Live duration.
   *
   * @param key - Unique cache key identifier
   * @param value - Value to cache
   * @param ttlMs - Time-to-live in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Deletes an item from the cache.
   *
   * @param key - Cache key identifier to remove
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clears all stored items from the cache.
   */
  clear(): void {
    this.store.clear();
  }
}

export const appCache = new MemoryTTLCache();
