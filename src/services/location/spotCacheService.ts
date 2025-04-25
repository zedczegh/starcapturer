
// Cache service for storing and retrieving spot data

const SPOT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const spotCache = new Map<string, {
  spots: any[],
  timestamp: number
}>();

/**
 * Get spots from cache if they exist and aren't expired
 */
export const getCachedSpots = (
  centerLat: number,
  centerLng: number,
  radius: number,
  limit: number
): any[] | null => {
  const cacheKey = `spots-${centerLat.toFixed(2)}-${centerLng.toFixed(2)}-${radius}-${limit}`;
  const cachedSpots = spotCache.get(cacheKey);
  
  if (cachedSpots && Date.now() - cachedSpots.timestamp < SPOT_CACHE_DURATION) {
    console.log(`Using cached spots for ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`);
    return cachedSpots.spots;
  }
  
  return null;
};

/**
 * Cache spots for future use
 */
export const cacheSpots = (
  centerLat: number,
  centerLng: number,
  radius: number,
  limit: number,
  spots: any[]
): void => {
  const cacheKey = `spots-${centerLat.toFixed(2)}-${centerLng.toFixed(2)}-${radius}-${limit}`;
  spotCache.set(cacheKey, {
    spots,
    timestamp: Date.now()
  });
};

/**
 * Clear the spot cache
 */
export const clearSpotCache = (): void => {
  spotCache.clear();
};

// Create a service object for easier imports
export const spotCacheService = {
  getCachedSpots,
  cacheSpots,
  clearSpotCache
};
