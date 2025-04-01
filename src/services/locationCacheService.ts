
/**
 * Location caching service to improve performance of repeated searches
 * Handles caching and fast retrieval of location data
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache structure with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Different cache collections for different data types
const locationRadiusCache = new Map<string, CacheEntry<SharedAstroSpot[]>>();
const coordinateCache = new Map<string, CacheEntry<any>>();

// TTL values (in milliseconds)
const LOCATION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const COORDINATE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Create a cache key from location search parameters
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param options Additional options for the search
 * @returns Cache key string
 */
export function createLocationCacheKey(
  latitude: number,
  longitude: number,
  radius: number,
  options?: Record<string, any>
): string {
  // Round coordinates and radius to reduce slight variations
  const lat = Math.round(latitude * 100) / 100;
  const lng = Math.round(longitude * 100) / 100;
  
  // Round radius to nearest 50km to increase cache hits
  const roundedRadius = Math.round(radius / 50) * 50;
  
  // Create base key
  let key = `${lat},${lng},${roundedRadius}`;
  
  // Add options to key if provided
  if (options) {
    const optionsKey = Object.entries(options)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    if (optionsKey) {
      key += `;${optionsKey}`;
    }
  }
  
  return key;
}

/**
 * Get locations from cache if available and not expired
 * @param cacheKey Cache key for the location search
 * @returns Cached locations or null if not in cache
 */
export function getCachedLocations(cacheKey: string): SharedAstroSpot[] | null {
  const entry = locationRadiusCache.get(cacheKey);
  
  if (!entry) return null;
  
  // Check if entry has expired
  if (Date.now() - entry.timestamp > LOCATION_CACHE_TTL) {
    locationRadiusCache.delete(cacheKey);
    return null;
  }
  
  return entry.data;
}

/**
 * Cache locations for a specific search
 * @param cacheKey Cache key for the location search
 * @param locations Locations to cache
 */
export function cacheLocations(cacheKey: string, locations: SharedAstroSpot[]): void {
  locationRadiusCache.set(cacheKey, {
    data: locations,
    timestamp: Date.now()
  });
  
  console.log(`Cached ${locations.length} locations with key: ${cacheKey}`);
}

/**
 * Clear all location search caches
 */
export function clearLocationSearchCache(): void {
  const locationCount = locationRadiusCache.size;
  locationRadiusCache.clear();
  console.log(`Cleared location search cache (${locationCount} entries removed)`);
}

/**
 * Get cached coordinate data (like reverse geocoding results)
 * @param key Cache key
 * @returns Cached data or null
 */
export function getCachedCoordinateData(key: string): any | null {
  const entry = coordinateCache.get(key);
  
  if (!entry) return null;
  
  // Check if entry has expired
  if (Date.now() - entry.timestamp > COORDINATE_CACHE_TTL) {
    coordinateCache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Cache coordinate data (like reverse geocoding results)
 * @param key Cache key
 * @param data Data to cache
 */
export function cacheCoordinateData(key: string, data: any): void {
  coordinateCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Check if there's a pending radius search in progress
 * Helps prevent duplicate searches
 */
let pendingRadiusSearch = false;

/**
 * Set the pending radius search flag
 * @param isPending Whether a search is pending
 */
export function setPendingRadiusSearch(isPending: boolean): void {
  pendingRadiusSearch = isPending;
}

/**
 * Check if there's a pending radius search
 * @returns True if a radius search is in progress
 */
export function isPendingRadiusSearch(): boolean {
  return pendingRadiusSearch;
}
