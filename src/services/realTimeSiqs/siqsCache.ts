
/**
 * Cache system for SIQS calculations
 * Reduces API calls and improves performance
 */
import { SiqsResult } from './siqsTypes';

// In-memory cache for SIQS results
const siqsCache = new Map<string, { result: SiqsResult; timestamp: number }>();

// Cache expiration time in milliseconds (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;

/**
 * Generate a cache key from location parameters
 */
export function generateSiqsCacheKey(
  latitude: number,
  longitude: number,
  bortleScale: number,
  weatherData?: any
): string {
  // Round coordinates to reduce unnecessary variations
  const lat = latitude.toFixed(5);
  const lng = longitude.toFixed(5);
  
  // Include weather data hash if available
  let weatherHash = '';
  if (weatherData) {
    const { cloudCover = 0, humidity = 50, temperature = 15 } = weatherData;
    weatherHash = `-w${cloudCover.toFixed(0)}-${humidity.toFixed(0)}-${temperature.toFixed(0)}`;
  }
  
  return `siqs-${lat}-${lng}-b${bortleScale}${weatherHash}`;
}

/**
 * Store SIQS result in cache
 */
export function cacheSiqsResult(key: string, result: SiqsResult): void {
  siqsCache.set(key, {
    result,
    timestamp: Date.now()
  });
}

/**
 * Get cached SIQS result if available
 */
export function getCachedSiqsResult(key: string): SiqsResult | null {
  const cached = siqsCache.get(key);
  
  // Return null if not found
  if (!cached) {
    return null;
  }
  
  // Check if cache has expired
  if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
    siqsCache.delete(key);
    return null;
  }
  
  return cached.result;
}

/**
 * Clear expired cache entries
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  
  for (const [key, cached] of siqsCache.entries()) {
    if (now - cached.timestamp > CACHE_EXPIRY) {
      siqsCache.delete(key);
    }
  }
}

/**
 * Clear the entire SIQS cache
 */
export function clearSiqsCache(): void {
  siqsCache.clear();
}

/**
 * Clear cache entries for a specific location
 */
export function clearLocationSiqsCache(latitude?: number, longitude?: number): void {
  if (latitude && longitude) {
    // Clear only for the specified location
    const lat = latitude.toFixed(5);
    const lng = longitude.toFixed(5);
    const prefix = `siqs-${lat}-${lng}`;
    
    for (const key of siqsCache.keys()) {
      if (key.startsWith(prefix)) {
        siqsCache.delete(key);
      }
    }
  } else {
    // Clear all cache entries
    siqsCache.clear();
  }
}
