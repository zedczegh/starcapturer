
// Re-export everything from the index file for backward compatibility
export * from './environmentalDataService/index';

// Improved cache utility for environmental data with multi-level caching strategy
export const environmentalDataCache = {
  bortleScaleCache: new Map<string, { value: number, source: string, timestamp: number, confidence: string }>(),
  weatherCache: new Map<string, any>(),
  starCountCache: new Map<string, { count: number, bortleScale: number, timestamp: number }>(),
  
  // Cache methods with enhanced source tracking
  setBortleScale(location: string, value: number, source: string = 'api', confidence: string = 'medium'): void {
    this.bortleScaleCache.set(location, {
      value,
      source,
      timestamp: Date.now(),
      confidence
    });
  },
  
  getBortleScale(location: string, maxAge: number = 12 * 60 * 60 * 1000): { value: number, source: string, confidence: string } | undefined {
    const cached = this.bortleScaleCache.get(location);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return {
        value: cached.value,
        source: cached.source,
        confidence: cached.confidence
      };
    }
    return undefined;
  },
  
  setWeatherData(location: string, data: any): void {
    this.weatherCache.set(location, {
      data,
      timestamp: Date.now()
    });
  },
  
  getWeatherData(location: string, maxAge: number = 15 * 60 * 1000): any | undefined {
    const cached = this.weatherCache.get(location);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data;
    }
    return undefined;
  },
  
  // Star count methods for enhanced Bortle scale accuracy
  setStarCount(location: string, count: number, bortleScale: number): void {
    this.starCountCache.set(location, {
      count,
      bortleScale,
      timestamp: Date.now()
    });
  },
  
  getStarCount(location: string, maxAge: number = 30 * 24 * 60 * 60 * 1000): { count: number, bortleScale: number } | undefined {
    const cached = this.starCountCache.get(location);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return {
        count: cached.count,
        bortleScale: cached.bortleScale
      };
    }
    return undefined;
  },
  
  // Clear specific cache or all caches
  clear(cacheType?: 'bortle' | 'weather' | 'star' | 'all'): void {
    if (!cacheType || cacheType === 'all') {
      this.bortleScaleCache.clear();
      this.weatherCache.clear();
      this.starCountCache.clear();
      return;
    }
    
    if (cacheType === 'bortle') this.bortleScaleCache.clear();
    if (cacheType === 'weather') this.weatherCache.clear();
    if (cacheType === 'star') this.starCountCache.clear();
  },
  
  // Get cache statistics
  getStats(): { bortle: number, weather: number, star: number } {
    return {
      bortle: this.bortleScaleCache.size,
      weather: this.weatherCache.size,
      star: this.starCountCache.size
    };
  }
};
