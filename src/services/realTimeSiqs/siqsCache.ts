
// Cache management system for SIQS calculations

// Create a cache to avoid redundant API calls with improved invalidation strategy
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
  factors?: any[];
}>();

// Invalidate cache entries older than 30 minutes for nighttime, 15 minutes for daytime
const NIGHT_CACHE_DURATION = 20 * 60 * 1000; // 20 minutes at night
const DAY_CACHE_DURATION = 10 * 60 * 1000;  // 10 minutes during day

/**
 * Determine if it's nighttime for cache duration purposes
 */
export const isNighttime = () => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 8; // 6 PM to 8 AM
};

/**
 * Get the appropriate cache duration based on time of day
 */
export const getCacheDuration = () => {
  return isNighttime() ? NIGHT_CACHE_DURATION : DAY_CACHE_DURATION;
};

/**
 * Check if a cached entry exists and is valid
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 */
export const hasCachedSiqs = (latitude: number, longitude: number): boolean => {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const cachedData = siqsCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < getCacheDuration()) {
    return true;
  }
  
  return false;
};

/**
 * Get a cached SIQS calculation
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 */
export const getCachedSiqs = (latitude: number, longitude: number) => {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const cachedData = siqsCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < getCacheDuration()) {
    return {
      siqs: cachedData.siqs,
      isViable: cachedData.isViable,
      factors: cachedData.factors
    };
  }
  
  return null;
};

/**
 * Set a SIQS calculation in the cache
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @param data SIQS calculation data
 */
export const setSiqsCache = (
  latitude: number,
  longitude: number,
  data: { 
    siqs: number; 
    isViable: boolean; 
    factors?: any[];
    metadata?: {
      calculatedAt: string;
      sources: {
        weather: boolean;
        forecast: boolean;
        clearSky: boolean;
        lightPollution: boolean;
      };
    };
  }
) => {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  siqsCache.set(cacheKey, {
    ...data,
    timestamp: Date.now()
  });
  
  // Also store in sessionStorage for persistence between page loads
  try {
    sessionStorage.setItem(`siqs_${cacheKey}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error("Failed to store SIQS in sessionStorage:", error);
  }
};

/**
 * Clear the entire SIQS cache
 */
export const clearSiqsCache = (): number => {
  const size = siqsCache.size;
  siqsCache.clear();
  return size;
};

/**
 * Clear specific location from the SIQS cache
 */
export const clearLocationSiqsCache = (latitude: number, longitude: number): boolean => {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  if (siqsCache.has(cacheKey)) {
    siqsCache.delete(cacheKey);
    return true;
  }
  return false;
};

/**
 * Clean up expired cache entries to free memory
 */
export const cleanupExpiredCache = (): number => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, data] of siqsCache.entries()) {
    const cacheDuration = isNighttime() ? NIGHT_CACHE_DURATION : DAY_CACHE_DURATION;
    
    if (now - data.timestamp > cacheDuration) {
      siqsCache.delete(key);
      expiredCount++;
    }
  }
  
  return expiredCount;
};

/**
 * Get the current SIQS cache size
 */
export const getSiqsCacheSize = (): number => {
  return siqsCache.size;
};
