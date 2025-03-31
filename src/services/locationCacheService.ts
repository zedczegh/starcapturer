
/**
 * Service for caching location data
 * Helps keep location results around between radius changes and searches
 */

// Cache for storing radius-based location searches 
const radiusSearchCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

// Configurable cache durations
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Get cached search results for a specific location + radius pair
 * @param latitude Latitude of center point
 * @param longitude Longitude of center point
 * @param radius Search radius in km
 * @returns Cached data or null if not found/expired
 */
export function getCachedLocationSearch(
  latitude: number, 
  longitude: number, 
  radius: number
): any | null {
  // Generate a cache key with reduced precision for better hit rates
  const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  
  const cachedData = radiusSearchCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    console.log(`Using cached location search for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}, radius: ${radius}km`);
    return cachedData.data;
  }
  
  return null;
}

/**
 * Store search results in cache
 * @param latitude Latitude of center point
 * @param longitude Longitude of center point
 * @param radius Search radius in km
 * @param data Data to cache
 */
export function cacheLocationSearch(
  latitude: number, 
  longitude: number, 
  radius: number, 
  data: any
): void {
  // Generate a cache key with reduced precision for better hit rates
  const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  
  radiusSearchCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  console.log(`Cached location search for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}, radius: ${radius}km`);
}

/**
 * Clear all location search caches
 */
export function clearLocationSearchCache(): void {
  const size = radiusSearchCache.size;
  radiusSearchCache.clear();
  console.log(`Location search cache cleared (${size} entries removed)`);
}

/**
 * Generate a unique cache key for a location
 */
export function generateLocationCacheKey(latitude: number, longitude: number, radius?: number): string {
  if (radius !== undefined) {
    return `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  }
  return `${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
}
