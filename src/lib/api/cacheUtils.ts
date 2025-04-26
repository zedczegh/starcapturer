
/**
 * Cache utilities for API data
 */

// Cache TTL in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Check if cache is expired
export function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL;
}

/**
 * Clear cache for a specific key pattern
 */
export function clearCache(keyPattern: string): void {
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Filter keys that match the pattern
    const matchingKeys = keys.filter(key => key.includes(keyPattern));
    
    // Remove matching items
    matchingKeys.forEach(key => localStorage.removeItem(key));
    
    console.log(`Cleared ${matchingKeys.length} cache items matching '${keyPattern}'`);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

/**
 * Clear specific cache for clear sky rate data
 */
export function clearClearSkyRateCache(latitude?: number, longitude?: number): void {
  if (latitude !== undefined && longitude !== undefined) {
    clearCache(`clear-sky-${latitude.toFixed(2)}-${longitude.toFixed(2)}`);
  } else {
    clearCache('clear-sky');
  }
}

/**
 * Set item with expiration
 */
export function setCacheItem(key: string, data: any): void {
  try {
    const item = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error("Error setting cache item:", error);
  }
}

/**
 * Get cached item if not expired
 */
export function getCacheItem(key: string): any {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsedItem = JSON.parse(item);
    
    if (isCacheExpired(parsedItem.timestamp)) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsedItem.data;
  } catch (error) {
    console.error("Error getting cache item:", error);
    return null;
  }
}
