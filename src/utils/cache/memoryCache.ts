
/**
 * Optimized in-memory cache for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum number of entries
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Clean up if cache is getting too large
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastUsedScore = Infinity;

    // Find least recently used item with lowest access count
    this.cache.forEach((entry, key) => {
      const score = entry.accessCount / (Date.now() - entry.lastAccessed + 1);
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    });

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private startCleanup(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.cache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));
    }, 5 * 60 * 1000);
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    let totalAccess = 0;
    this.cache.forEach(entry => {
      totalAccess += entry.accessCount;
    });

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess / Math.max(1, this.cache.size)
    };
  }
}

export const memoryCache = new MemoryCache();
