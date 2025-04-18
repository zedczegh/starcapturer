
// Cache management system for SIQS calculations
import { 
  getCacheDuration, 
  getLocationKey, 
  isNighttime,
  AUTO_CLEANUP_INTERVAL 
} from './cacheConfig';
import { 
  saveToSessionStorage, 
  loadFromSessionStorage 
} from './cacheStorage';

// Create a cache to avoid redundant API calls with improved invalidation strategy
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
  weatherData?: any;
  forecastData?: any;
  factors?: any[];
  metadata?: {
    calculatedAt: string;
    sources: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
      terrainCorrected?: boolean;
      climate?: boolean;
    };
    reliability?: {
      score: number;
      issues: string[];
    };
  };
}>();

// Register automatic cache cleanup
let cleanupTimer: number | null = null;
if (typeof window !== 'undefined') {
  cleanupTimer = window.setInterval(() => {
    const cleaned = cleanupExpiredCache();
    if (cleaned > 0) {
      console.log(`Auto-cleaned ${cleaned} expired SIQS cache entries`);
    }
  }, AUTO_CLEANUP_INTERVAL);
}

/**
 * Check if a cached entry exists and is valid
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 */
export const hasCachedSiqs = (latitude: number, longitude: number): boolean => {
  const cacheKey = getLocationKey(latitude, longitude);
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
  const cacheKey = getLocationKey(latitude, longitude);
  const cachedData = siqsCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < getCacheDuration()) {
    return {
      siqs: cachedData.siqs,
      isViable: cachedData.isViable,
      weatherData: cachedData.weatherData,
      forecastData: cachedData.forecastData,
      factors: cachedData.factors,
      metadata: cachedData.metadata
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
    weatherData?: any;
    forecastData?: any;
    factors?: any[];
    metadata?: {
      calculatedAt: string;
      sources: {
        weather: boolean;
        forecast: boolean;
        clearSky: boolean;
        lightPollution: boolean;
        terrainCorrected?: boolean;
        climate?: boolean;
      };
      reliability?: {
        score: number;
        issues: string[];
      };
    };
  }
) => {
  const cacheKey = getLocationKey(latitude, longitude);
  
  siqsCache.set(cacheKey, {
    ...data,
    timestamp: Date.now()
  });
  
  // Also store in sessionStorage for persistence between page loads
  saveToSessionStorage(cacheKey, data, Date.now());
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
  const cacheKey = getLocationKey(latitude, longitude);
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
    const cacheDuration = isNighttime() ? getCacheDuration() : getCacheDuration();
    
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

/**
 * Clean up resources on module unload/page close
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (cleanupTimer !== null) {
      clearInterval(cleanupTimer);
    }
  });
}

// Export the cache for advanced usage
export { siqsCache };
