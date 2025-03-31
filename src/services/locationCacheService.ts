
/**
 * Lightweight caching service for location search results
 * to improve performance and reduce API calls
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache for location search results
const locationSearchCache = new Map<string, {
  data: SharedAstroSpot[];
  timestamp: number;
}>();

// Invalidate cache entries older than 15 minutes
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Get cached location search results
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius
 * @param cacheKey Optional specific cache key
 * @returns Array of locations or null if not in cache
 */
export function getCachedLocationSearch(
  latitude: number,
  longitude: number,
  radius: number,
  cacheKey?: string
): SharedAstroSpot[] | null {
  // Generate cache key if not provided
  const key = cacheKey || `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  
  const cachedData = locationSearchCache.get(key);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    return cachedData.data;
  }
  
  return null;
}

/**
 * Cache location search results
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius
 * @param data Location search results
 * @param cacheKey Optional specific cache key
 */
export function cacheLocationSearch(
  latitude: number,
  longitude: number,
  radius: number,
  data: SharedAstroSpot[],
  cacheKey?: string
): void {
  // Generate cache key if not provided
  const key = cacheKey || `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  
  locationSearchCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear location search cache
 */
export function clearLocationSearchCache(): void {
  const size = locationSearchCache.size;
  locationSearchCache.clear();
  console.log(`Location search cache cleared (${size} entries removed)`);
}

/**
 * Get location search cache size
 * @returns Number of cached entries
 */
export function getLocationSearchCacheSize(): number {
  return locationSearchCache.size;
}
