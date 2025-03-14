
/**
 * A utility for managing persistent cache in localStorage
 */
export class PersistentCache {
  private readonly prefix: string;
  private readonly defaultExpiry: number;
  private readonly maxItems: number;

  constructor(prefix: string = 'app-cache', defaultExpiry: number = 24 * 60 * 60 * 1000, maxItems: number = 100) {
    this.prefix = prefix;
    this.defaultExpiry = defaultExpiry; // Default expiry time in ms (24 hours)
    this.maxItems = maxItems; // Maximum number of items to store in cache
  }

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param expiry Expiry time in ms (optional)
   */
  set<T>(key: string, value: T, expiry?: number): void {
    try {
      const prefixedKey = `${this.prefix}-${key}`;
      const item = {
        value,
        expiry: Date.now() + (expiry || this.defaultExpiry),
        timestamp: Date.now()
      };

      localStorage.setItem(prefixedKey, JSON.stringify(item));
      
      // Manage cache size
      this.pruneCache();
    } catch (error) {
      console.warn('Failed to set cache item:', error);
    }
  }

  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    try {
      const prefixedKey = `${this.prefix}-${key}`;
      const itemStr = localStorage.getItem(prefixedKey);
      
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      // Check if the item has expired
      if (item.expiry && item.expiry < Date.now()) {
        localStorage.removeItem(prefixedKey);
        return null;
      }
      
      // Update timestamp to mark as recently used
      item.timestamp = Date.now();
      localStorage.setItem(prefixedKey, JSON.stringify(item));
      
      return item.value as T;
    } catch (error) {
      console.warn('Failed to get cache item:', error);
      return null;
    }
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  remove(key: string): void {
    try {
      const prefixedKey = `${this.prefix}-${key}`;
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.warn('Failed to remove cache item:', error);
    }
  }

  /**
   * Clear all cached items with this prefix
   */
  clear(): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Prune the cache if it exceeds the maximum number of items
   * Removes the least recently used items first
   */
  private pruneCache(): void {
    try {
      const cacheItems: { key: string; timestamp: number }[] = [];
      
      // Collect all cache items with their keys and timestamps
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            if (item.timestamp) {
              cacheItems.push({ key, timestamp: item.timestamp });
            }
          } catch (e) {
            // Invalid item, could be removed
            localStorage.removeItem(key);
          }
        }
      });
      
      // If we exceed the max items, sort by timestamp and remove oldest
      if (cacheItems.length > this.maxItems) {
        // Sort by timestamp (ascending - oldest first)
        cacheItems.sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove the oldest items
        const itemsToRemove = cacheItems.slice(0, cacheItems.length - this.maxItems);
        itemsToRemove.forEach(item => {
          localStorage.removeItem(item.key);
        });
      }
    } catch (error) {
      console.warn('Failed to prune cache:', error);
    }
  }
}

// Export a singleton instance for global use
export const globalCache = new PersistentCache('location-search');
