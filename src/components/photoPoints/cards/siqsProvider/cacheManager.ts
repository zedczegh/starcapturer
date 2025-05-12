
/**
 * Cache management for SIQS results
 */

import { getCachedItem, setCachedItem } from '@/utils/optimizedCache';
import type { CacheEntry } from './types';

// Memory-efficient result cache
export const resultCache = new Map<string, CacheEntry>();
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a cache key for SIQS data
 */
export function getSiqsCacheKey(
  latitude: number | undefined, 
  longitude: number | undefined,
  bortleScale: number
): string | null {
  if (!latitude || !longitude) return null;
  return `siqs-${latitude.toFixed(5)}-${longitude.toFixed(5)}-${bortleScale}`;
}

/**
 * Check cache for existing SIQS data
 * @returns The cached data if found, null otherwise
 */
export function checkSiqsCache(
  cacheKey: string | null, 
  forceUpdate = false
): any | null {
  if (!cacheKey || forceUpdate) return null;
  
  // Use optimized cache first
  const cachedData = getCachedItem<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Fallback to resultCache
  const cached = resultCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }
  
  return null;
}

/**
 * Update both caches with new SIQS data
 */
export function updateSiqsCache(cacheKey: string | null, result: any): void {
  if (!cacheKey) return;
  
  // Update resultCache
  resultCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  // Update optimized cache
  setCachedItem(cacheKey, result, CACHE_DURATION);
}
