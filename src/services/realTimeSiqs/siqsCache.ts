
// Cache for SIQS calculations
const siqsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Clear the SIQS cache
 */
export function clearSiqsCache(): void {
  siqsCache.clear();
  console.log("SIQS cache cleared");
}

/**
 * Clear cache for a specific location
 */
export function clearLocationSiqsCache(latitude: number, longitude: number): void {
  const key = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  siqsCache.delete(key);
  console.log(`Cache cleared for location ${key}`);
}

/**
 * Get cache size
 */
export function getSiqsCacheSize(): number {
  return siqsCache.size;
}

/**
 * Clean up expired entries in the cache
 * @returns Number of entries removed
 */
export function cleanupExpiredCache(): number {
  const now = Date.now();
  let removedCount = 0;
  
  siqsCache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_DURATION) {
      siqsCache.delete(key);
      removedCount++;
    }
  });
  
  return removedCount;
}

/**
 * Get cached SIQS data
 */
export function getCachedSiqs(latitude: number, longitude: number): any | null {
  const key = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const cached = siqsCache.get(key);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }
  
  return null;
}

/**
 * Cache SIQS data
 */
export function cacheSiqsData(latitude: number, longitude: number, data: any): void {
  const key = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  siqsCache.set(key, {
    data,
    timestamp: Date.now()
  });
}
