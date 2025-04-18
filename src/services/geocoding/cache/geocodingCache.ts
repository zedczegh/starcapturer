import { EnhancedLocationDetails } from '../types/enhancedLocationTypes';

/**
 * Cache interface for storing geocoding results
 */
export interface GeocodeCache {
  [key: string]: {
    timestamp: number;
    data: EnhancedLocationDetails;
  }
}

// In-memory cache to prevent excessive API calls
const geocodeCache: GeocodeCache = {};
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 100; // Limit cache size for performance

/**
 * Get a cached geocoding result if available and not expired
 */
export function getFromCache(cacheKey: string): EnhancedLocationDetails | null {
  const now = Date.now();
  
  if (geocodeCache[cacheKey] && (now - geocodeCache[cacheKey].timestamp < CACHE_EXPIRY)) {
    return geocodeCache[cacheKey].data;
  }
  
  return null;
}

/**
 * Add result to the geocoding cache
 */
export function addToCache(cacheKey: string, data: EnhancedLocationDetails): void {
  geocodeCache[cacheKey] = {
    timestamp: Date.now(),
    data
  };
  
  // Periodically clean up cache
  if (Object.keys(geocodeCache).length > MAX_CACHE_ENTRIES) {
    cleanupCache();
  }
}

/**
 * Cleanup old entries from cache to prevent memory leaks
 */
export function cleanupCache(): void {
  const now = Date.now();
  const cacheKeys = Object.keys(geocodeCache);
  
  // If cache is within limits, just check for expired entries
  if (cacheKeys.length <= MAX_CACHE_ENTRIES) {
    for (const key of cacheKeys) {
      if (now - geocodeCache[key].timestamp > CACHE_EXPIRY) {
        delete geocodeCache[key];
      }
    }
    return;
  }
  
  // If cache exceeds max size, sort by timestamp and keep only most recent
  const keysByAge = cacheKeys
    .map(key => ({ key, timestamp: geocodeCache[key].timestamp }))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_CACHE_ENTRIES - 10) // Keep 10 fewer than max to avoid frequent cleanup
    .map(item => item.key);
  
  // Create new cache with only the keys we want to keep
  const newCache: GeocodeCache = {};
  keysByAge.forEach(key => {
    newCache[key] = geocodeCache[key];
  });
  
  // Replace cache with cleaned version
  Object.keys(geocodeCache).forEach(key => delete geocodeCache[key]);
  Object.assign(geocodeCache, newCache);
}
