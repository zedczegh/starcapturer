
/**
 * An optimized utility for managing persistent cache in localStorage
 */
export class PersistentCache {
  private readonly prefix: string;
  private readonly defaultExpiry: number;
  private readonly maxItems: number;
  // In-memory cache for faster access
  private memoryCache: Map<string, any> = new Map();

  constructor(prefix: string = 'app-cache', defaultExpiry: number = 24 * 60 * 60 * 1000, maxItems: number = 100) {
    this.prefix = prefix;
    this.defaultExpiry = defaultExpiry; // Default expiry time in ms (24 hours)
    this.maxItems = maxItems; // Maximum number of items to store in cache
    
    // Initialize memory cache from localStorage on creation
    this.initMemoryCache();
  }

  /**
   * Initialize memory cache from localStorage for faster subsequent access
   */
  private initMemoryCache(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            if (item.expiry && item.expiry > Date.now()) {
              this.memoryCache.set(key, item);
            } else {
              // Remove expired items
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Invalid item, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to initialize memory cache:', error);
    }
  }

  /**
   * Set an item in both memory and localStorage cache
   */
  set<T>(key: string, value: T, expiry?: number): void {
    try {
      const prefixedKey = `${this.prefix}-${key}`;
      const item = {
        value,
        expiry: Date.now() + (expiry || this.defaultExpiry),
        timestamp: Date.now()
      };

      // Store in memory cache first
      this.memoryCache.set(prefixedKey, item);
      
      // Then in localStorage
      localStorage.setItem(prefixedKey, JSON.stringify(item));
      
      // Manage cache size
      this.pruneCache();
    } catch (error) {
      console.warn('Failed to set cache item:', error);
    }
  }

  /**
   * Get an item from cache (memory first, then localStorage)
   */
  get<T>(key: string): T | null {
    try {
      const prefixedKey = `${this.prefix}-${key}`;
      
      // Try memory cache first (much faster)
      const memoryItem = this.memoryCache.get(prefixedKey);
      if (memoryItem) {
        if (memoryItem.expiry > Date.now()) {
          // Update access timestamp
          memoryItem.timestamp = Date.now();
          this.memoryCache.set(prefixedKey, memoryItem);
          return memoryItem.value as T;
        } else {
          // Remove expired item
          this.memoryCache.delete(prefixedKey);
          localStorage.removeItem(prefixedKey);
          return null;
        }
      }
      
      // Fall back to localStorage
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
      
      // Update both caches
      this.memoryCache.set(prefixedKey, item);
      localStorage.setItem(prefixedKey, JSON.stringify(item));
      
      return item.value as T;
    } catch (error) {
      console.warn('Failed to get cache item:', error);
      return null;
    }
  }

  /**
   * Remove an item from both caches
   */
  remove(key: string): void {
    try {
      const prefixedKey = `${this.prefix}-${key}`;
      this.memoryCache.delete(prefixedKey);
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
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear localStorage
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
      // Check memory cache size first
      if (this.memoryCache.size > this.maxItems) {
        const entries = Array.from(this.memoryCache.entries())
          .map(([key, value]) => ({ key, timestamp: value.timestamp }))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove oldest items
        const itemsToRemove = entries.slice(0, entries.length - this.maxItems);
        itemsToRemove.forEach(item => {
          this.memoryCache.delete(item.key);
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
