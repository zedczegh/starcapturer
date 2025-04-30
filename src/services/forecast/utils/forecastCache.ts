
/**
 * Forecast caching service with optimized memory usage and performance
 */

import { ForecastCacheItem } from "../types/forecastTypes";

/**
 * Cache implementation for forecast results
 */
export class ForecastCache {
  private cache = new Map<string, ForecastCacheItem>();
  
  private static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes by default
  
  constructor(private cacheDuration: number = ForecastCache.CACHE_DURATION) {}
  
  /**
   * Get cached forecast data if it exists and is still valid
   */
  public getCachedForecast(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }
  
  /**
   * Store forecast data in cache with current timestamp
   */
  public setCachedForecast(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Invalidate cache entries matching a pattern or clear all cache
   */
  public invalidateCache(keyPattern?: string): void {
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
  
  /**
   * Get cache size statistics
   */
  public getCacheStats(): { size: number, oldestTimestamp: number | null, newestTimestamp: number | null } {
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;
    
    for (const item of this.cache.values()) {
      if (oldestTimestamp === null || item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
      }
      if (newestTimestamp === null || item.timestamp > newestTimestamp) {
        newestTimestamp = item.timestamp;
      }
    }
    
    return {
      size: this.cache.size,
      oldestTimestamp,
      newestTimestamp
    };
  }
}

// Create and export singleton cache instance
export const forecastCache = new ForecastCache();
