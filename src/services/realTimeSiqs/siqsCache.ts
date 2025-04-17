
import { SiqsResult } from './siqsTypes';

// Define cache interface
interface CacheEntry {
  data: SiqsResult;
  timestamp: number;
}

// In-memory cache for SIQS results
const siqsCache = new Map<string, CacheEntry>();

// Default cache duration (10 minutes)
const DEFAULT_CACHE_DURATION = 10 * 60 * 1000;

/**
 * Generate cache key from coordinates
 */
const getCacheKey = (latitude: number, longitude: number): string => {
  return `siqs_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
};

/**
 * Check if valid cached SIQS data exists for coordinates
 */
export const hasCachedSiqs = (
  latitude: number,
  longitude: number,
  maxAgeMins = 10
): boolean => {
  const key = getCacheKey(latitude, longitude);
  if (!siqsCache.has(key)) return false;
  
  const cachedEntry = siqsCache.get(key)!;
  const maxAge = maxAgeMins * 60 * 1000;
  const age = Date.now() - cachedEntry.timestamp;
  
  return age < maxAge;
};

/**
 * Get cached SIQS data if it exists and is not expired
 */
export const getCachedSiqs = (
  latitude: number,
  longitude: number,
  maxAgeMins = 10
): SiqsResult | null => {
  const key = getCacheKey(latitude, longitude);
  if (!siqsCache.has(key)) return null;
  
  const cachedEntry = siqsCache.get(key)!;
  const maxAge = maxAgeMins * 60 * 1000;
  const age = Date.now() - cachedEntry.timestamp;
  
  if (age < maxAge) {
    return cachedEntry.data;
  }
  
  return null;
};

/**
 * Save SIQS data to cache
 */
export const setSiqsCache = (
  latitude: number,
  longitude: number,
  data: SiqsResult
): void => {
  const key = getCacheKey(latitude, longitude);
  siqsCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Clear cache for a specific location
 */
export const clearLocationSiqsCache = (
  latitude: number,
  longitude: number
): void => {
  const key = getCacheKey(latitude, longitude);
  siqsCache.delete(key);
};

/**
 * Clear entire SIQS cache
 */
export const clearSiqsCache = (): void => {
  siqsCache.clear();
};

/**
 * Get the number of entries in the cache
 */
export const getSiqsCacheSize = (): number => {
  return siqsCache.size;
};

/**
 * Remove expired entries from cache
 */
export const cleanupExpiredCache = (maxAgeMins = 30): number => {
  const now = Date.now();
  const maxAge = maxAgeMins * 60 * 1000;
  let removedCount = 0;
  
  for (const [key, entry] of siqsCache.entries()) {
    if (now - entry.timestamp > maxAge) {
      siqsCache.delete(key);
      removedCount++;
    }
  }
  
  return removedCount;
};

// Add the missing types file:
