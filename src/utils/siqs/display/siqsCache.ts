
/**
 * SIQS Cache Utilities
 */

/**
 * Get cached real-time SIQS for a location
 */
export function getCachedRealTimeSiqs(latitude: number, longitude: number): number | null {
  try {
    // Generate cache key
    const coordsKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cacheKey = `siqs_cache_${coordsKey}`;
    
    // Try to get from localStorage
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData) return null;
    
    const parsed = JSON.parse(cachedData);
    
    // Check if cached data is still valid
    if (parsed.siqs && parsed.expiry > Date.now()) {
      return parsed.siqs;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached SIQS:', error);
    return null;
  }
}
