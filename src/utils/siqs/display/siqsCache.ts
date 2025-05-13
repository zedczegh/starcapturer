
/**
 * SIQS Display Cache Module
 * Provides caching functionality for SIQS display values
 */

import { optimizedCache } from '@/utils/optimizedCache';

// Cache key prefix for real-time SIQS values
const CACHE_KEY_PREFIX = 'siqs_realtime_';

/**
 * Get cached real-time SIQS for specific coordinates
 */
export const getCachedRealTimeSiqs = (latitude: number, longitude: number): number | null => {
  if (!latitude || !longitude) return null;
  
  const cacheKey = `${CACHE_KEY_PREFIX}${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  return optimizedCache.getCachedItem(cacheKey);
};

/**
 * Set cached real-time SIQS for specific coordinates
 */
export const setCachedRealTimeSiqs = (latitude: number, longitude: number, siqs: number): void => {
  if (!latitude || !longitude || siqs === null) return;
  
  const cacheKey = `${CACHE_KEY_PREFIX}${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  optimizedCache.setCachedItem(cacheKey, siqs, 5 * 60 * 1000); // Cache for 5 minutes
};

/**
 * Clear cached real-time SIQS for specific coordinates
 */
export const clearCachedRealTimeSiqs = (latitude: number, longitude: number): void => {
  if (!latitude || !longitude) return;
  
  const cacheKey = `${CACHE_KEY_PREFIX}${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  optimizedCache.removeCachedItem(cacheKey);
};

/**
 * Check if cached real-time SIQS exists for specific coordinates
 */
export const hasCachedRealTimeSiqs = (latitude: number, longitude: number): boolean => {
  if (!latitude || !longitude) return false;
  
  const cacheKey = `${CACHE_KEY_PREFIX}${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  const cached = optimizedCache.getCachedItem(cacheKey);
  return cached !== null && cached !== undefined;
};
