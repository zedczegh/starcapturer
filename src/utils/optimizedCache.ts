
/**
 * Optimized cache utility for better performance
 */

// In-memory cache for fastest access
const memoryCache = new Map<string, any>();
const expiryTimes = new Map<string, number>();

// Constants for cache management
const CACHE_PREFIX = 'app_cache:';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get an item from the cache
 */
export function getCachedItem<T>(key: string): T | null {
  try {
    // First check memory cache
    if (memoryCache.has(key)) {
      const expiry = expiryTimes.get(key) || 0;
      if (expiry > Date.now()) {
        return memoryCache.get(key) as T;
      } else {
        // Clean up expired item
        memoryCache.delete(key);
        expiryTimes.delete(key);
      }
    }

    // Then check localStorage
    const cachedValue = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (cachedValue) {
      try {
        const parsed = JSON.parse(cachedValue);
        if (parsed.expiry && parsed.expiry > Date.now()) {
          // Keep in memory for faster access next time
          memoryCache.set(key, parsed.value);
          expiryTimes.set(key, parsed.expiry);
          return parsed.value as T;
        } else {
          // Clean up expired item
          localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        }
      } catch (e) {
        // Invalid JSON or other parsing error
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      }
    }
    
    return null;
  } catch (e) {
    console.error('Error retrieving from cache:', e);
    return null;
  }
}

/**
 * Set an item in the cache
 */
export function setCachedItem<T>(key: string, value: T, ttl: number = DEFAULT_TTL): void {
  try {
    const expiry = Date.now() + ttl;
    
    // Update memory cache
    memoryCache.set(key, value);
    expiryTimes.set(key, expiry);
    
    // Update localStorage
    try {
      localStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify({ value, expiry })
      );
    } catch (e) {
      // Handle storage quota exceeded
      if (e instanceof DOMException && (
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        clearOldCache();
        // Try again
        try {
          localStorage.setItem(
            `${CACHE_PREFIX}${key}`,
            JSON.stringify({ value, expiry })
          );
        } catch (retryError) {
          console.error('Still could not write to cache after cleanup:', retryError);
        }
      } else {
        console.error('Error writing to localStorage:', e);
      }
    }
  } catch (e) {
    console.error('Error setting cache item:', e);
  }
}

/**
 * Remove an item from the cache
 */
export function removeCachedItem(key: string): void {
  memoryCache.delete(key);
  expiryTimes.delete(key);
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (e) {
    console.error('Error removing from localStorage:', e);
  }
}

/**
 * Clear all cache or by prefix
 */
export function clearCache(prefix?: string): void {
  if (prefix) {
    // Clear memory cache with prefix
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
        expiryTimes.delete(key);
      }
    }
    
    // Clear localStorage with prefix
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${CACHE_PREFIX}${prefix}`)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Error clearing cache with prefix:', e);
    }
  } else {
    // Clear all cache
    memoryCache.clear();
    expiryTimes.clear();
    
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Error clearing all cache:', e);
    }
  }
}

/**
 * Clean old cache entries when storage is full
 */
function clearOldCache(): void {
  try {
    const cacheItems: Array<{key: string; expiry: number}> = [];
    
    // Collect all cache items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const data = JSON.parse(value);
            if (data.expiry) {
              cacheItems.push({
                key,
                expiry: data.expiry
              });
            }
          }
        } catch (e) {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      }
    }
    
    // Sort by expiry (oldest first)
    cacheItems.sort((a, b) => a.expiry - b.expiry);
    
    // Remove oldest 20% of items
    const removeCount = Math.ceil(cacheItems.length * 0.2);
    for (let i = 0; i < removeCount && i < cacheItems.length; i++) {
      localStorage.removeItem(cacheItems[i].key);
    }
  } catch (e) {
    console.error('Error cleaning cache:', e);
  }
}

/**
 * Initialize cache system
 */
export function initializeCache(): void {
  console.log('Initializing optimized cache system');
  // Clean expired items on init
  cleanExpiredItems();
  
  // Set up periodic cleanup
  if (typeof window !== 'undefined') {
    setInterval(() => {
      cleanExpiredItems();
    }, 10 * 60 * 1000); // Every 10 minutes
  }
}

/**
 * Clean up expired cache items
 */
function cleanExpiredItems(): void {
  const now = Date.now();
  
  // Clean memory cache
  for (const [key, expiry] of expiryTimes.entries()) {
    if (expiry < now) {
      memoryCache.delete(key);
      expiryTimes.delete(key);
    }
  }
  
  // Clean localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const data = JSON.parse(value);
            if (data.expiry && data.expiry < now) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      }
    }
  } catch (e) {
    console.error('Error cleaning expired cache items:', e);
  }
}

/**
 * Clear all optimized storage
 * This function is used during sign out to clean all user data
 */
export function clearOptimizedStorage(): void {
  console.log('Clearing all optimized storage');
  clearCache(); // This will clear all cache
}

// Export a singleton instance for optimizedCache
export const optimizedCache = {
  getCachedItem,
  setCachedItem,
  removeCachedItem,
  clearCache
};
