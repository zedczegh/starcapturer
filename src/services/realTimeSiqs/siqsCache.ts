
// Continue implementation of SIQS caching

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

