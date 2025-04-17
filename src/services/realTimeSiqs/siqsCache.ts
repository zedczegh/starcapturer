
/**
 * Caching service for SIQS calculations
 */

// Cache for SIQS calculations
const siqsCache: Record<string, { result: any, timestamp: number }> = {};

// Location SIQS cache
const locationSiqsCache: Record<string, { result: any, timestamp: number }> = {};

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

/**
 * Cache location SIQS result
 */
export function cacheLocationSiqs(key: string, result: any): void {
  locationSiqsCache[key] = {
    result,
    timestamp: Date.now()
  };
}

/**
 * Get cached location SIQS
 */
export function getCachedLocationSiqs(key: string, maxAgeMs: number = 10 * 60 * 1000): any | null {
  const cached = locationSiqsCache[key];
  if (cached && (Date.now() - cached.timestamp) < maxAgeMs) {
    return cached.result;
  }
  return null;
}

/**
 * Check if SIQS is cached
 */
export function hasCachedSiqs(key: string, maxAgeMs: number = 10 * 60 * 1000): boolean {
  const cached = siqsCache[key];
  return !!(cached && (Date.now() - cached.timestamp) < maxAgeMs);
}

/**
 * Get cached SIQS
 */
export function getCachedSiqs(key: string, maxAgeMs: number = 10 * 60 * 1000): any | null {
  return getCachedSiqsResult(key, maxAgeMs);
}

/**
 * Clear location SIQS cache
 */
export function clearLocationSiqsCache(): void {
  Object.keys(locationSiqsCache).forEach(key => {
    delete locationSiqsCache[key];
  });
  console.log("Location SIQS cache cleared");
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  
  // Clean up SIQS cache
  Object.keys(siqsCache).forEach(key => {
    if ((now - siqsCache[key].timestamp) >= maxAgeMs) {
      delete siqsCache[key];
    }
  });
  
  // Clean up location SIQS cache
  Object.keys(locationSiqsCache).forEach(key => {
    if ((now - locationSiqsCache[key].timestamp) >= maxAgeMs) {
      delete locationSiqsCache[key];
    }
  });
}
