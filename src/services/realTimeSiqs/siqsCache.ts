
/**
 * SIQS calculation cache management
 */

import { SiqsResult } from './siqsTypes';

// Cache of SIQS calculations with TTL
const siqsCache: Record<string, {
  result: SiqsResult;
  timestamp: number;
}> = {};

// Default TTL is 30 minutes
const DEFAULT_TTL = 30 * 60 * 1000;

/**
 * Generate a cache key for SIQS calculation
 */
export function generateSiqsCacheKey(
  latitude: number, 
  longitude: number, 
  bortleScale: number,
  weatherData?: any
): string {
  // Basic cache key using coordinates and Bortle scale
  let key = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale}`;
  
  // Include cloud cover in key if available
  if (weatherData && typeof weatherData.cloudCover === 'number') {
    key += `-${Math.round(weatherData.cloudCover)}`;
  }
  
  return key;
}

/**
 * Cache a SIQS result
 */
export function cacheSiqsResult(key: string, result: SiqsResult): void {
  siqsCache[key] = {
    result,
    timestamp: Date.now()
  };
}

/**
 * Get a cached SIQS result if available and not expired
 */
export function getCachedSiqsResult(key: string, ttl: number = DEFAULT_TTL): SiqsResult | null {
  const cached = siqsCache[key];
  
  if (!cached) {
    return null;
  }
  
  // Check if cache entry has expired
  if (Date.now() - cached.timestamp > ttl) {
    delete siqsCache[key]; // Clean up expired entry
    return null;
  }
  
  return cached.result;
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(ttl: number = DEFAULT_TTL): void {
  const now = Date.now();
  
  Object.keys(siqsCache).forEach(key => {
    if (now - siqsCache[key].timestamp > ttl) {
      delete siqsCache[key];
    }
  });
}

/**
 * Clear the entire SIQS cache
 */
export function clearSiqsCache(): void {
  Object.keys(siqsCache).forEach(key => {
    delete siqsCache[key];
  });
}

/**
 * Clear cache entries for a specific location
 */
export function clearLocationSiqsCache(latitude: number, longitude: number): void {
  const prefix = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  Object.keys(siqsCache).forEach(key => {
    if (key.startsWith(prefix)) {
      delete siqsCache[key];
    }
  });
}
