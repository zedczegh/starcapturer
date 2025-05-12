/**
 * Configuration for SIQS caching system
 */

// Cache duration in milliseconds
export const DEFAULT_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
export const CERTIFIED_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for certified locations
export const DSR_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes for dark sky reserves

// Auto cleanup interval in milliseconds
export const AUTO_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Maximum items to keep in memory cache
export const MAX_MEMORY_CACHE_SIZE = 300;

// Get location key for cache lookup
export function getLocationKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
}

// Get cache duration based on location type
export function getCacheDuration(isDarkSkyReserve = false, isCertified = false): number {
  if (isDarkSkyReserve) {
    return DSR_CACHE_DURATION;
  }
  if (isCertified) {
    return CERTIFIED_CACHE_DURATION;
  }
  return DEFAULT_CACHE_DURATION;
}

// Lookup coordinates by cache key
export function coordsFromKey(key: string): [number, number] | null {
  const parts = key.split('-');
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (isNaN(lat) || isNaN(lng)) return null;
  
  return [lat, lng];
}
