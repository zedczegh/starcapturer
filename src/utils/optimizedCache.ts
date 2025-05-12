
/**
 * Optimized cache utility with memory and persistence layers
 * Improves application performance by reducing API calls and calculations
 */

type CacheItem<T> = {
  data: T;
  expiry: number;
};

class OptimizedCache {
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private readonly PREFIX = 'app_cache_';
  
  constructor() {
    // Clean up expired items on init
    this.cleanExpiredItems();
  }
  
  /**
   * Get item from cache with fast access
   * @param key Cache key
   * @returns Cached item or null if not found/expired
   */
  getCachedItem<T>(key: string): T | null {
    const cacheKey = this.getFullKey(key);
    
    // Check memory cache first (fastest)
    const memoryItem = this.memoryCache.get(cacheKey);
    if (memoryItem && Date.now() < memoryItem.expiry) {
      return memoryItem.data as T;
    }
    
    // If not in memory, try localStorage
    try {
      const storedItem = localStorage.getItem(cacheKey);
      if (storedItem) {
        const parsed = JSON.parse(storedItem) as CacheItem<T>;
        
        // Check if expired
        if (Date.now() >= parsed.expiry) {
          // Remove expired item
          localStorage.removeItem(cacheKey);
          return null;
        }
        
        // Add to memory cache for faster access next time
        this.memoryCache.set(cacheKey, parsed);
        return parsed.data;
      }
    } catch (error) {
      // If there's any error reading from storage, just return null
      console.warn('Cache read error:', error);
    }
    
    return null;
  }
  
  /**
   * Store item in cache
   * @param key Cache key
   * @param data Data to store
   * @param ttl Time to live in milliseconds
   */
  setCachedItem<T>(key: string, data: T, ttlMs: number = 60000): void {
    const cacheKey = this.getFullKey(key);
    const expiry = Date.now() + ttlMs;
    const cacheItem: CacheItem<T> = { data, expiry };
    
    // Store in memory first (fast access)
    this.memoryCache.set(cacheKey, cacheItem);
    
    // Try to store in localStorage as well (persistence)
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
      // Handle storage quota exceeded
      console.warn('Cache storage error:', error);
      // Clear some space if needed
      this.clearOldestItems(5);
      
      // Try again
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      } catch {
        // Give up if it fails again
      }
    }
  }
  
  /**
   * Remove item from cache
   * @param key Cache key
   */
  removeCachedItem(key: string): void {
    const cacheKey = this.getFullKey(key);
    this.memoryCache.delete(cacheKey);
    
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // Ignore errors
    }
  }
  
  /**
   * Clear all cached items or items with specific prefix
   * @param prefix Optional prefix to clear only matching items
   */
  clearCache(prefix?: string): void {
    const fullPrefix = prefix ? this.getFullKey(prefix) : this.PREFIX;
    
    // Clear from memory
    if (prefix) {
      // Only clear items with matching prefix
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(fullPrefix)) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      // Clear all
      this.memoryCache.clear();
    }
    
    // Clear from localStorage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(fullPrefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Ignore errors
    }
  }
  
  /**
   * Clean up expired items to free up space
   */
  private cleanExpiredItems(): void {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (now >= item.expiry) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clean localStorage (less frequently)
    if (Math.random() < 0.1) { // Only do this 10% of the time to reduce overhead
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.PREFIX)) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              if (item.expiry && now >= item.expiry) {
                localStorage.removeItem(key);
              }
            } catch {
              // Remove invalid items
              localStorage.removeItem(key);
            }
          }
        }
      } catch {
        // Ignore errors
      }
    }
  }
  
  /**
   * Clear the oldest cached items to free up space
   * @param count Number of items to clear
   */
  private clearOldestItems(count: number): void {
    try {
      const items: Array<{ key: string; expiry: number }> = [];
      
      // Collect all cache items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            items.push({ key, expiry: item.expiry || 0 });
          } catch {
            // Skip invalid items
          }
        }
      }
      
      // Sort by expiry (oldest first)
      items.sort((a, b) => a.expiry - b.expiry);
      
      // Remove the oldest items
      for (let i = 0; i < Math.min(count, items.length); i++) {
        localStorage.removeItem(items[i].key);
      }
    } catch {
      // Ignore errors
    }
  }
  
  /**
   * Get full cache key with prefix
   */
  private getFullKey(key: string): string {
    return key.startsWith(this.PREFIX) ? key : `${this.PREFIX}${key}`;
  }
}

// Export singleton instance
export const optimizedCache = new OptimizedCache();
