
/**
 * Enhanced in-memory cache implementation for better performance
 */

import type { CacheItem, CacheKey, CacheValue } from './cacheTypes';

class MemoryCache {
  private cache = new Map<CacheKey, CacheItem>();
  private maxSize: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.startCleanupInterval();
  }

  /**
   * Get an item from cache
   */
  get<T>(key: CacheKey): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  /**
   * Set an item in cache
   */
  set<T>(key: CacheKey, data: CacheValue<T>, ttl = 5 * 60 * 1000): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    const expires = Date.now() + ttl;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      expires
    };
    
    this.cache.set(key, item);
  }

  /**
   * Check if an item exists and is not expired
   */
  has(key: CacheKey): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete an item from cache
   */
  delete(key: CacheKey): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Remove expired items
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: CacheKey[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Evict oldest items when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 20% of items
    const itemsToRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < itemsToRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval (for cleanup)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const memoryCache = new MemoryCache();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryCache.destroy();
  });
}
