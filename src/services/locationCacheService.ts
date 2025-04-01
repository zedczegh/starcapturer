
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

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes
const EXTENDED_CACHE_EXPIRATION_MS = 2 * 60 * 60 * 1000; // 2 hours for stable locations

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
 * @param extendedExpiration Use longer expiration for stable data like dark sky locations
 */
export function cacheLocationSearch(
  latitude: number,
  longitude: number,
  radius: number,
  locations: SharedAstroSpot[],
  customKey?: string,
  extendedExpiration = false
): void {
  const key = generateCacheKey(latitude, longitude, radius, customKey);
  const now = Date.now();
  const expirationTime = extendedExpiration ? EXTENDED_CACHE_EXPIRATION_MS : CACHE_EXPIRATION_MS;
  
  locationSearchCache[key] = {
    locations,
    timestamp: now,
    expiresAt: now + expirationTime
  };
  
  console.log(`Cached ${locations.length} locations with key ${key}${extendedExpiration ? ' (extended)' : ''}`);
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
  
  console.log(`Cache hit for key ${key}: ${cacheEntry.locations.length} locations`);
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

/**
 * Get cache statistics for debugging and monitoring
 * @returns Cache statistics including hit count, size, and average age
 */
export function getCacheStatistics(): {
  entryCount: number;
  totalSize: number;
  averageAge: number;
  oldestEntry: number;
} {
  const keys = Object.keys(locationSearchCache);
  const now = Date.now();
  
  if (keys.length === 0) {
    return {
      entryCount: 0,
      totalSize: 0,
      averageAge: 0,
      oldestEntry: 0
    };
  }
  
  let totalAge = 0;
  let oldestEntry = 0;
  
  keys.forEach(key => {
    const entry = locationSearchCache[key];
    const age = now - entry.timestamp;
    totalAge += age;
    
    if (age > oldestEntry) {
      oldestEntry = age;
    }
  });
  
  return {
    entryCount: keys.length,
    totalSize: JSON.stringify(locationSearchCache).length,
    averageAge: totalAge / keys.length,
    oldestEntry: oldestEntry
  };
}
