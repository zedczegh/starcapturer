
// A simple cache for SIQS calculation results to reduce API calls
// and improve performance

// Cache structure mapping location key to SIQS result and expiration time
interface CacheEntry {
  result: any;
  expiry: number;
}

interface SiqsCache {
  [key: string]: CacheEntry;
}

const cache: SiqsCache = {};

// Default cache duration (30 minutes)
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000;

/**
 * Generate a cache key for a location
 */
function getCacheKey(latitude: number, longitude: number, bortleScale?: number): string {
  const bortleStr = bortleScale !== undefined ? `,${bortleScale}` : '';
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}${bortleStr}`;
}

/**
 * Check if SIQS result exists in cache
 */
export function hasCachedSiqs(latitude: number, longitude: number, bortleScale?: number): boolean {
  const key = getCacheKey(latitude, longitude, bortleScale);
  const entry = cache[key];
  
  if (entry && entry.expiry > Date.now()) {
    return true;
  }
  
  return false;
}

/**
 * Get SIQS result from cache if available
 */
export function getCachedSiqs(latitude: number, longitude: number, bortleScale?: number): any | null {
  const key = getCacheKey(latitude, longitude, bortleScale);
  const entry = cache[key];
  
  if (entry && entry.expiry > Date.now()) {
    return entry.result;
  }
  
  // Clean up expired entry if present
  if (entry) {
    delete cache[key];
  }
  
  return null;
}

/**
 * Store SIQS result in cache
 */
export function cacheSiqsResult(
  latitude: number,
  longitude: number,
  bortleScale: number,
  result: any,
  duration: number = DEFAULT_CACHE_DURATION
): void {
  const key = getCacheKey(latitude, longitude, bortleScale);
  cache[key] = {
    result,
    expiry: Date.now() + duration
  };
}

/**
 * Clear all cached SIQS results
 */
export function clearSiqsCache(): void {
  for (const key in cache) {
    delete cache[key];
  }
}

/**
 * Clear cached SIQS result for a specific location
 */
export function clearLocationSiqsCache(latitude: number, longitude: number, bortleScale?: number): void {
  if (bortleScale !== undefined) {
    // Clear specific Bortle scale entry
    const key = getCacheKey(latitude, longitude, bortleScale);
    delete cache[key];
  } else {
    // Clear all entries for this lat/long regardless of Bortle scale
    const prefix = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    for (const key in cache) {
      if (key.startsWith(prefix)) {
        delete cache[key];
      }
    }
  }
}

/**
 * Get the current size of the cache
 */
export function getSiqsCacheSize(): number {
  return Object.keys(cache).length;
}

/**
 * Clean up expired entries in the cache
 * @returns Number of entries removed
 */
export function cleanupExpiredCache(): number {
  const now = Date.now();
  let removed = 0;
  
  for (const key in cache) {
    if (cache[key].expiry < now) {
      delete cache[key];
      removed++;
    }
  }
  
  return removed;
}
