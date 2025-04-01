
/**
 * Service for caching location search results
 * Reduces API calls and improves performance for repeated searches
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface LocationCache {
  [key: string]: {
    locations: SharedAstroSpot[];
    timestamp: number;
    expiresAt: number;
  };
}

// In-memory cache for location search results
const locationSearchCache: LocationCache = {};

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION_MS = 30 * 60 * 1000;

/**
 * Generate a cache key for location search
 * @param latitude Latitude
 * @param longitude Longitude
 * @param radius Search radius
 * @param customKey Optional custom key
 * @returns Cache key string
 */
const generateCacheKey = (
  latitude: number, 
  longitude: number, 
  radius: number,
  customKey?: string
): string => {
  if (customKey) {
    return customKey;
  }
  
  // Round coordinates to reduce cache fragmentation
  const lat = Math.round(latitude * 100) / 100;
  const lng = Math.round(longitude * 100) / 100;
  
  // Round radius to nearest 100km for better cache hits
  const roundedRadius = Math.ceil(radius / 100) * 100;
  
  return `${lat},${lng},${roundedRadius}`;
};

/**
 * Cache location search results
 * @param latitude Search center latitude
 * @param longitude Search center longitude
 * @param radius Search radius in km
 * @param locations Location results to cache
 * @param customKey Optional custom cache key
 */
export function cacheLocationSearch(
  latitude: number,
  longitude: number,
  radius: number,
  locations: SharedAstroSpot[],
  customKey?: string
): void {
  const key = generateCacheKey(latitude, longitude, radius, customKey);
  const now = Date.now();
  
  locationSearchCache[key] = {
    locations,
    timestamp: now,
    expiresAt: now + CACHE_EXPIRATION_MS
  };
  
  console.log(`Cached ${locations.length} locations with key ${key}`);
}

/**
 * Get cached location search results if available and not expired
 * @param latitude Search center latitude
 * @param longitude Search center longitude
 * @param radius Search radius in km
 * @param customKey Optional custom cache key
 * @returns Cached locations or null if cache miss or expired
 */
export function getCachedLocationSearch(
  latitude: number,
  longitude: number,
  radius: number,
  customKey?: string
): SharedAstroSpot[] | null {
  const key = generateCacheKey(latitude, longitude, radius, customKey);
  const cacheEntry = locationSearchCache[key];
  
  if (!cacheEntry) {
    return null;
  }
  
  // Check if cache has expired
  if (Date.now() > cacheEntry.expiresAt) {
    console.log(`Cache expired for key ${key}`);
    delete locationSearchCache[key];
    return null;
  }
  
  return cacheEntry.locations;
}

/**
 * Clear all cached location search results
 */
export function clearLocationSearchCache(): void {
  Object.keys(locationSearchCache).forEach(key => {
    delete locationSearchCache[key];
  });
  console.log("Location search cache cleared");
}

/**
 * Clear specific cached location search
 * @param latitude Search center latitude
 * @param longitude Search center longitude
 * @param radius Search radius in km
 * @param customKey Optional custom cache key
 */
export function clearSpecificLocationCache(
  latitude: number,
  longitude: number,
  radius: number,
  customKey?: string
): void {
  const key = generateCacheKey(latitude, longitude, radius, customKey);
  
  if (locationSearchCache[key]) {
    delete locationSearchCache[key];
    console.log(`Cleared cache for key ${key}`);
  }
}
