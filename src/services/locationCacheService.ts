
/**
 * Service for caching location search results
 * Reduces API calls and improves performance for repeated searches
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isValidAstronomyLocation } from '@/utils/locationValidator';

interface LocationCache {
  [key: string]: {
    locations: SharedAstroSpot[];
    timestamp: number;
    expiresAt: number;
  };
}

// In-memory cache for location search results
const locationSearchCache: LocationCache = {};

// Cache expiration time (30 minutes by default)
const DEFAULT_CACHE_EXPIRATION_MS = 30 * 60 * 1000;

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
 * @param expirationMs Optional cache expiration time in milliseconds
 */
export function cacheLocationSearch(
  latitude: number,
  longitude: number,
  radius: number,
  locations: SharedAstroSpot[],
  customKey?: string,
  expirationMs?: number
): void {
  // Filter out any potential water locations before caching
  const validLocations = locations.filter(loc => 
    isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)
  );
  
  if (validLocations.length < locations.length) {
    console.log(`Filtered out ${locations.length - validLocations.length} water locations before caching`);
  }
  
  const key = generateCacheKey(latitude, longitude, radius, customKey);
  const now = Date.now();
  const actualExpirationMs = expirationMs || DEFAULT_CACHE_EXPIRATION_MS;
  
  locationSearchCache[key] = {
    locations: validLocations,
    timestamp: now,
    expiresAt: now + actualExpirationMs
  };
  
  console.log(`Cached ${validLocations.length} locations with key ${key}, expires in ${Math.round(actualExpirationMs/60000)} minutes`);
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
  
  // Additional validation pass to ensure no water locations
  const validLocations = cacheEntry.locations.filter(loc => 
    isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)
  );
  
  if (validLocations.length < cacheEntry.locations.length) {
    console.log(`Filtered out ${cacheEntry.locations.length - validLocations.length} water locations from cached results`);
    // Update the cache with filtered locations
    cacheEntry.locations = validLocations;
  }
  
  return validLocations;
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
 * Get all cache keys for debugging
 * @returns Array of cache keys
 */
export function getCacheKeys(): string[] {
  return Object.keys(locationSearchCache);
}

/**
 * Get cache statistics for monitoring
 * @returns Object with cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  totalLocations: number;
  averageLocationsPerEntry: number;
  oldestEntry: number;
  newestEntry: number;
} {
  const keys = Object.keys(locationSearchCache);
  let totalLocations = 0;
  let oldestTimestamp = Date.now();
  let newestTimestamp = 0;
  
  keys.forEach(key => {
    const entry = locationSearchCache[key];
    totalLocations += entry.locations.length;
    
    if (entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp;
    }
    
    if (entry.timestamp > newestTimestamp) {
      newestTimestamp = entry.timestamp;
    }
  });
  
  const now = Date.now();
  const oldestEntryAge = now - oldestTimestamp;
  const newestEntryAge = now - newestTimestamp;
  
  return {
    totalEntries: keys.length,
    totalLocations,
    averageLocationsPerEntry: keys.length ? totalLocations / keys.length : 0,
    oldestEntry: Math.round(oldestEntryAge / 1000),
    newestEntry: Math.round(newestEntryAge / 1000)
  };
}
