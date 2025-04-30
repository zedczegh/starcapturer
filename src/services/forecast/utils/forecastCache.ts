
/**
 * Forecast cache implementation
 */

import { ForecastCacheItem } from "../types/forecastTypes";

/**
 * Cache implementation for forecast results
 */
class ForecastCache {
  private cache = new Map<string, ForecastCacheItem>();
  
  private static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  
  getCachedForecast(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ForecastCache.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }
  
  setCachedForecast(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  invalidateCache(keyPattern?: string): void {
    if (keyPattern) {
      // Delete matching keys
      for (const key of this.cache.keys()) {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
}

// Create singleton cache instance
export const forecastCache = new ForecastCache();
