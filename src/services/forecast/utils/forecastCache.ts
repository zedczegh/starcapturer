
/**
 * Cache utility for forecast data
 */

class ForecastCache {
  private cache: Map<string, any> = new Map();
  private timestamps: Map<string, number> = new Map();
  private defaultTTL = 60 * 60 * 1000; // 1 hour in milliseconds
  
  /**
   * Get cached forecast data if available and not expired
   * @param key - Cache key
   * @param ttl - Time to live in milliseconds
   */
  public getCachedForecast<T>(key: string, ttl: number = this.defaultTTL): T | null {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const timestamp = this.timestamps.get(key) || 0;
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > ttl) {
      // Remove expired cache entry
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    
    return this.cache.get(key) as T;
  }
  
  /**
   * Set forecast data in cache
   * @param key - Cache key
   * @param data - Data to cache
   */
  public setCachedForecast<T>(key: string, data: T): void {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }
  
  /**
   * Invalidate cache entries
   * @param pattern - Optional string pattern to match against keys
   */
  public invalidateCache(pattern?: string): void {
    if (!pattern) {
      // Clear entire cache
      this.cache.clear();
      this.timestamps.clear();
      return;
    }
    
    // Clear entries matching the pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsageEstimate: JSON.stringify(Array.from(this.cache.entries())).length / 1024
    };
  }
}

export const forecastCache = new ForecastCache();
export default forecastCache;
