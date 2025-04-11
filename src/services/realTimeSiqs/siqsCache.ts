
// Cache implementation for SIQS data
import { SiqsCacheEntry } from './types';

// Create a cache to avoid redundant API calls with improved invalidation strategy
const siqsCache = new Map<string, SiqsCacheEntry>();

// Invalidate cache entries older than 30 minutes for nighttime, 15 minutes for daytime
const NIGHT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const DAY_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Determine if it's nighttime for cache duration
 */
export const isNighttime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 8; // 6 PM to 8 AM
};

/**
 * Get cache duration based on time of day
 */
export const getCacheDuration = (): number => {
  return isNighttime() ? NIGHT_CACHE_DURATION : DAY_CACHE_DURATION;
};

/**
 * Generate a cache key for coordinates
 */
export const generateCacheKey = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
};

/**
 * Get an entry from the SIQS cache
 */
export const getCacheEntry = (key: string): SiqsCacheEntry | undefined => {
  return siqsCache.get(key);
};

/**
 * Set an entry in the SIQS cache
 */
export const setCacheEntry = (key: string, entry: SiqsCacheEntry): void => {
  siqsCache.set(key, entry);
};

/**
 * Clear the SIQS cache for testing or debugging
 */
export const clearSiqsCache = (): void => {
  const size = siqsCache.size;
  siqsCache.clear();
  console.log(`SIQS cache cleared (${size} entries removed)`);
};

/**
 * Get the current SIQS cache size
 * @returns Number of cached entries
 */
export const getSiqsCacheSize = (): number => {
  return siqsCache.size;
};

/**
 * Clear specific location from the SIQS cache
 */
export const clearLocationSiqsCache = (latitude: number, longitude: number): void => {
  const cacheKey = generateCacheKey(latitude, longitude);
  if (siqsCache.has(cacheKey)) {
    siqsCache.delete(cacheKey);
    console.log(`Cleared SIQS cache for location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  }
};

/**
 * Clear all expired cache entries to free memory
 */
export const cleanupExpiredCache = (): void => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, data] of siqsCache.entries()) {
    const cacheDuration = getCacheDuration();
    
    if (now - data.timestamp > cacheDuration) {
      siqsCache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    console.log(`Cleaned up ${expiredCount} expired SIQS cache entries`);
  }
};
