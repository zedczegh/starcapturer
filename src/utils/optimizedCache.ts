
/**
 * Optimized cache utility with memory and persistence layers
 * Improves application performance by reducing API calls and calculations
 */

type CacheItem<T> = {
  data: T;
  expires: number;
};

// In-memory cache for fastest access
const memoryCache = new Map<string, CacheItem<any>>();

/**
 * Get item from cache with fast access
 * @param key Cache key
 * @returns Cached item or null if not found/expired
 */
export function getCachedItem<T>(key: string): T | null {
  try {
    // Check memory cache first for fastest performance
    const item = memoryCache.get(key);
    if (item && item.expires > Date.now()) {
      return item.data as T;
    }
    
    // If not in memory or expired, try localStorage
    const storedItem = localStorage.getItem(`cache:${key}`);
    if (storedItem) {
      try {
        const parsed = JSON.parse(storedItem) as CacheItem<T>;
        if (parsed.expires > Date.now()) {
          // Add to memory cache for faster subsequent access
          memoryCache.set(key, parsed);
          return parsed.data;
        } else {
          // Remove expired item
          localStorage.removeItem(`cache:${key}`);
        }
      } catch (e) {
        // Invalid data, remove it
        localStorage.removeItem(`cache:${key}`);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Store item in cache
 * @param key Cache key
 * @param data Data to store
 * @param ttlMs Time to live in milliseconds
 */
export function setCachedItem<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
  try {
    const expires = Date.now() + ttlMs;
    const item: CacheItem<T> = { data, expires };
    
    // Store in memory cache first
    memoryCache.set(key, item);
    
    // Then persist to localStorage if available
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(item));
    } catch (e) {
      // Handle storage quota exceeded
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        clearOldestCacheItems();
        try {
          localStorage.setItem(`cache:${key}`, JSON.stringify(item));
        } catch (retryError) {
          console.error('Failed to store item after clearing cache:', retryError);
        }
      } else {
        console.error('Error storing cache item:', e);
      }
    }
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Clear specific cache item
 */
export function clearCacheItem(key: string): void {
  memoryCache.delete(key);
  localStorage.removeItem(`cache:${key}`);
}

/**
 * Clear all cache items with optional prefix
 */
export function clearCache(prefix?: string): void {
  // Clear from memory
  if (prefix) {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  } else {
    memoryCache.clear();
  }
  
  // Clear from localStorage
  try {
    if (prefix) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`cache:${prefix}`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } else {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear oldest items when storage is full
 */
function clearOldestCacheItems(): void {
  try {
    const cacheItems: Array<{ key: string; expires: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache:')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.expires) {
            cacheItems.push({ key, expires: item.expires });
          }
        } catch (e) {
          // Skip invalid items
        }
      }
    }
    
    // Sort by expiration (oldest first)
    cacheItems.sort((a, b) => a.expires - b.expires);
    
    // Remove oldest 20% of items
    const itemsToRemove = Math.ceil(cacheItems.length * 0.2);
    cacheItems.slice(0, itemsToRemove).forEach(item => {
      localStorage.removeItem(item.key);
      const memoryKey = item.key.replace('cache:', '');
      memoryCache.delete(memoryKey);
    });
  } catch (error) {
    console.error('Error clearing oldest cache items:', error);
  }
}

/**
 * Initialize cache from localStorage on startup
 */
export function initializeCache(): void {
  try {
    let restoredCount = 0;
    
    // Only load unexpired items from localStorage to memory cache
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache:')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.expires && item.expires > Date.now()) {
            const memoryKey = key.replace('cache:', '');
            memoryCache.set(memoryKey, item);
            restoredCount++;
          } else {
            // Remove expired items
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Skip invalid items
          localStorage.removeItem(key);
        }
      }
    }
    
    console.log(`Initialized cache with ${restoredCount} valid items`);
  } catch (error) {
    console.error('Error initializing cache:', error);
  }
}

// Initialize cache on module load if in browser environment
if (typeof window !== 'undefined') {
  initializeCache();
}
