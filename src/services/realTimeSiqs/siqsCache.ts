
/**
 * Enhanced SIQS calculation caching system
 * Provides efficient storage and retrieval of SIQS data with automatic cleanup
 */

// Cache implementation with Map for fast lookup
const siqsCache = new Map<string, {
  siqs: number;
  isViable: boolean;
  factors?: any[];
  metadata?: any;
  timestamp: number;
}>();

// Helper function to generate cache key from coordinates
const getLocationKey = (latitude: number, longitude: number): string => {
  // Round to 4 decimal places for consistent lookup (approx. 11 meters precision)
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
};

// Default cache duration in milliseconds (30 minutes)
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000;

// Get cache duration with possible override from environment
const getCacheDuration = (): number => {
  const envDuration = process.env.SIQS_CACHE_DURATION;
  return envDuration ? parseInt(envDuration, 10) : DEFAULT_CACHE_DURATION;
};

/**
 * Check if a location has cached SIQS data
 */
export const hasCachedSiqs = (latitude: number, longitude: number): boolean => {
  const key = getLocationKey(latitude, longitude);
  const cached = siqsCache.get(key);
  
  if (!cached) return false;
  
  return (Date.now() - cached.timestamp) < getCacheDuration();
};

/**
 * Get cached SIQS data for a location
 */
export const getCachedSiqs = (latitude: number, longitude: number) => {
  const key = getLocationKey(latitude, longitude);
  const cached = siqsCache.get(key);
  
  if (!cached || (Date.now() - cached.timestamp) > getCacheDuration()) {
    return null;
  }
  
  return {
    siqs: cached.siqs,
    isViable: cached.isViable,
    factors: cached.factors,
    metadata: cached.metadata
  };
};

/**
 * Store SIQS calculation results in cache
 */
export const setSiqsCache = (latitude: number, longitude: number, data: any) => {
  const key = getLocationKey(latitude, longitude);
  
  siqsCache.set(key, {
    ...data,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries periodically
  if (siqsCache.size > 100) { // Prevent cache from growing too large
    const now = Date.now();
    for (const [key, value] of siqsCache.entries()) {
      if (now - value.timestamp > getCacheDuration() * 2) {
        siqsCache.delete(key);
      }
    }
  }
};

/**
 * Clear all SIQS cache entries
 */
export const clearSiqsCache = (): void => {
  siqsCache.clear();
  console.log("SIQS cache cleared");
};

/**
 * Clear SIQS cache for a specific location
 */
export const clearLocationSiqsCache = (latitude: number, longitude: number): void => {
  const key = getLocationKey(latitude, longitude);
  
  if (siqsCache.has(key)) {
    siqsCache.delete(key);
    console.log(`SIQS cache cleared for location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    return;
  }
  
  console.log(`No cached SIQS found for location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
};

/**
 * Get the current size of the SIQS cache
 */
export const getSiqsCacheSize = (): number => {
  return siqsCache.size;
};

/**
 * Clean up expired cache entries
 * @returns Number of entries removed
 */
export const cleanupExpiredCache = (): number => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, value] of siqsCache.entries()) {
    if (now - value.timestamp > getCacheDuration()) {
      siqsCache.delete(key);
      expiredCount++;
    }
  }
  
  return expiredCount;
};
