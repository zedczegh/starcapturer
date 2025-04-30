

/**
 * Simple forecast data cache
 */
import { ForecastDayAstroData } from "../types/forecastTypes";

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION_MS = 30 * 60 * 1000;

// Interface for cache items
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Cache storage
const cache: Record<string, CacheItem<any>> = {};

export const forecastCache = {
  // Store forecast data in cache
  cacheForecast: (key: string, data: ForecastDayAstroData[] | ForecastDayAstroData): void => {
    cache[key] = {
      data,
      timestamp: Date.now()
    };
  },
  
  // Get cached forecast data if valid
  getCachedForecast: <T>(key: string): T | null => {
    const item = cache[key];
    
    if (!item) return null;
    
    const isValid = Date.now() - item.timestamp < CACHE_DURATION_MS;
    
    return isValid ? item.data : null;
  },
  
  // Clear specific item from cache
  clearCache: (key: string): void => {
    delete cache[key];
  },
  
  // Clear all cache items
  clearAllCache: () => {
    Object.keys(cache).forEach(key => {
      delete cache[key];
    });
  },
  
  // For compatibility with enhancedForecastAstroAdapter
  invalidateCache: (pattern?: string): void => {
    if (pattern) {
      Object.keys(cache).forEach(key => {
        if (key.includes(pattern)) {
          delete cache[key];
        }
      });
    } else {
      Object.keys(cache).forEach(key => {
        delete cache[key];
      });
    }
  },
  
  // Alternative name for cacheForecast - for compatibility
  setCachedForecast: (key: string, data: ForecastDayAstroData[] | ForecastDayAstroData): void => {
    cache[key] = {
      data,
      timestamp: Date.now()
    };
  }
};

