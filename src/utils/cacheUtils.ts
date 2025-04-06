
/**
 * Set data in cache with expiration
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in milliseconds (default 1 hour)
 */
export function setCachedData(key: string, data: any, ttl: number = 3600000): void {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expires: Math.floor(ttl / 60000) // minutes
    };
    
    localStorage.setItem(`cache:${key}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.error(`Failed to cache data for ${key}:`, error);
  }
}

/**
 * Get data from cache if not expired
 * @param key Cache key
 * @param maxAge Maximum age in milliseconds (default 1 hour)
 * @returns Cached data or null if expired/not found
 */
export function getCachedData(key: string, maxAge: number = 3600000): any | null {
  try {
    const cached = localStorage.getItem(`cache:${key}`);
    
    if (!cached) return null;
    
    const cacheItem = JSON.parse(cached);
    const age = Date.now() - cacheItem.timestamp;
    
    if (age > maxAge) {
      // Cache expired, remove it
      localStorage.removeItem(`cache:${key}`);
      return null;
    }
    
    return cacheItem;
  } catch (error) {
    console.error(`Failed to get cached data for ${key}:`, error);
    return null;
  }
}

/**
 * Clear all cached data
 */
export function clearAllCachedData(): void {
  const keys = Object.keys(localStorage);
  let count = 0;
  
  for (const key of keys) {
    if (key.startsWith('cache:')) {
      localStorage.removeItem(key);
      count++;
    }
  }
  
  console.log(`Cleared ${count} cache entries`);
}
