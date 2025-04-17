
/**
 * Caching service for SIQS calculations
 */

// Cache for SIQS calculations
const siqsCache: Record<string, { result: any, timestamp: number }> = {};

/**
 * Cache SIQS result
 */
export function cacheSiqsResult(key: string, result: any): void {
  siqsCache[key] = {
    result,
    timestamp: Date.now()
  };
}

/**
 * Get cached SIQS result if valid
 * @returns Cached result or null if expired/missing
 */
export function getCachedSiqsResult(key: string, maxAgeMs: number = 10 * 60 * 1000): any | null {
  const cached = siqsCache[key];
  if (cached && (Date.now() - cached.timestamp) < maxAgeMs) {
    return cached.result;
  }
  return null;
}

/**
 * Clear SIQS cache
 */
export function clearSiqsCache(): void {
  Object.keys(siqsCache).forEach(key => {
    delete siqsCache[key];
  });
  console.log("SIQS cache cleared");
}

/**
 * Generate cache key for SIQS calculation
 */
export function generateSiqsCacheKey(
  latitude: number, 
  longitude: number, 
  bortleScale: number,
  weatherData?: any
): string {
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale}-${JSON.stringify(weatherData || {})}`;
}
