/**
 * Lightweight in-memory TTL cache to reduce external API latency
 * and protect against third-party rate limits.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryTTLCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries = 200;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

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
}

export const appCache = new MemoryTTLCache();
