
/**
 * Cache utility functions for API data
 */

// Cache duration constants
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clear cached data for a specific key or cache group
 * @param cacheKey The specific cache key or prefix to clear
 */
export function clearCache(cacheKey: string): void {
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Filter keys that match the cache key or start with the cache key as a prefix
    const matchingKeys = keys.filter(key => 
      key === cacheKey || 
      (cacheKey.endsWith('*') && key.startsWith(cacheKey.slice(0, -1))) || 
      key.startsWith(`cache:${cacheKey}`)
    );
    
    // Remove matching keys
    matchingKeys.forEach(key => localStorage.removeItem(key));
    
    console.log(`Cleared ${matchingKeys.length} cache entries for: ${cacheKey}`);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

/**
 * Clear cached data for a clear sky rate at specific coordinates
 * @param latitude Location latitude
 * @param longitude Location longitude
 */
export function clearClearSkyRateCache(latitude?: number, longitude?: number): void {
  if (latitude !== undefined && longitude !== undefined) {
    const cacheKey = `clear-sky-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
    clearCache(cacheKey);
    return;
  }
  
  clearCache('clear-sky');
}

/**
 * Store data in cache with expiration
 * @param key Cache key
 * @param data Data to cache
 * @param duration Cache duration in milliseconds
 */
export function setCacheData<T>(key: string, data: T, duration: number = DEFAULT_CACHE_DURATION): void {
  try {
    const cacheItem = {
      data,
      expiry: Date.now() + duration
    };
    
    localStorage.setItem(`cache:${key}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.error("Error setting cache data:", error);
  }
}

/**
 * Retrieve data from cache if not expired
 * @param key Cache key
 * @returns Cached data or null if expired or not found
 */
export function getCacheData<T>(key: string): T | null {
  try {
    const cacheItem = localStorage.getItem(`cache:${key}`);
    if (!cacheItem) return null;
    
    const { data, expiry } = JSON.parse(cacheItem);
    
    // Return data if not expired
    return Date.now() < expiry ? data : null;
  } catch (error) {
    console.error("Error getting cache data:", error);
    return null;
  }
}
