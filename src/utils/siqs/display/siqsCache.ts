
/**
 * Optimized cache for SIQS display values
 */

import { optimizedCache } from '@/utils/optimizedCache';

// Cache key prefix for SIQS data
const SIQS_CACHE_PREFIX = 'siqs-realtime';
const SIQS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get cached real-time SIQS for a location
 */
export function getCachedRealTimeSiqs(latitude: number, longitude: number): number | null {
  if (!latitude || !longitude) return null;
  
  const cacheKey = `${SIQS_CACHE_PREFIX}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  try {
    const cachedData = optimizedCache.getCachedItem(cacheKey);
    if (!cachedData) return null;
    
    // Check if cache is still valid
    const timestamp = cachedData.timestamp || 0;
    if (Date.now() - timestamp > SIQS_CACHE_TTL) {
      return null;
    }
    
    return typeof cachedData.value === 'number' ? cachedData.value : null;
  } catch (error) {
    console.error('Error getting cached SIQS:', error);
    return null;
  }
}

/**
 * Cache real-time SIQS for a location
 */
export function setCachedRealTimeSiqs(latitude: number, longitude: number, siqsValue: number): void {
  if (!latitude || !longitude || typeof siqsValue !== 'number') return;
  
  const cacheKey = `${SIQS_CACHE_PREFIX}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  try {
    optimizedCache.setCachedItem(cacheKey, {
      value: siqsValue,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error caching SIQS:', error);
  }
}

/**
 * Check if we have cached SIQS for a location
 */
export function hasCachedRealTimeSiqs(latitude: number, longitude: number): boolean {
  return getCachedRealTimeSiqs(latitude, longitude) !== null;
}
