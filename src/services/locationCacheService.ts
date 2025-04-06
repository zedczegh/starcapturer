
/**
 * Location cache service
 */

// Cache for storing location data
const locationCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Clear the location search cache
 */
export function clearLocationSearchCache(): void {
  locationCache.clear();
}

/**
 * Cache location data
 */
export function cacheLocationData(key: string, data: any): void {
  locationCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Get cached location data
 */
export function getCachedLocationData(key: string, maxAgeMs: number = 30 * 60 * 1000): any {
  const cached = locationCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < maxAgeMs) {
    return cached.data;
  }
  return null;
}
