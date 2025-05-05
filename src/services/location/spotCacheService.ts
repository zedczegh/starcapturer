
// Cache service for storing and retrieving spot data with optimized memory usage

const SPOT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100; // Prevent memory leaks

class SpotCacheService {
  private cache: Map<string, { spots: any[]; timestamp: number }>;
  private memoryUsage: number;
  private maxMemoryUsage: number;
  
  constructor() {
    this.cache = new Map();
    this.memoryUsage = 0;
    this.maxMemoryUsage = 10 * 1024 * 1024; // 10MB max cache size
  }

  private cleanOldEntries() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > SPOT_CACHE_DURATION) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    // Log only if we cleaned something
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }
  
  private estimateObjectSize(obj: any): number {
    try {
      const jsonStr = JSON.stringify(obj);
      return jsonStr.length * 2; // Rough estimate, 2 bytes per char
    } catch (e) {
      return 1000; // Default size if can't serialize
    }
  }

  getCachedSpots(
    centerLat: number,
    centerLng: number,
    radius: number,
    limit: number
  ): any[] | null {
    const cacheKey = `spots-${centerLat.toFixed(2)}-${centerLng.toFixed(2)}-${radius}-${limit}`;
    const cachedSpots = this.cache.get(cacheKey);
    
    if (cachedSpots && Date.now() - cachedSpots.timestamp < SPOT_CACHE_DURATION) {
      console.log("Using cached spots for", cacheKey);
      return cachedSpots.spots;
    }
    
    return null;
  }

  cacheSpots(
    centerLat: number,
    centerLng: number,
    radius: number,
    limit: number,
    spots: any[]
  ): void {
    // Clean old entries before adding new ones
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.cleanOldEntries();
    }

    const cacheKey = `spots-${centerLat.toFixed(2)}-${centerLng.toFixed(2)}-${radius}-${limit}`;
    
    // Skip caching if we already have this key
    if (this.cache.has(cacheKey)) {
      return;
    }
    
    const entrySize = this.estimateObjectSize(spots);
    this.memoryUsage += entrySize;
    
    this.cache.set(cacheKey, {
      spots,
      timestamp: Date.now()
    });
    
    console.log(`Cached ${spots.length} spots with key ${cacheKey}`);
    
    // If we're over memory budget, remove oldest entries
    if (this.memoryUsage > this.maxMemoryUsage) {
      let oldestKey = null;
      let oldestTime = Infinity;
      
      for (const [key, value] of this.cache.entries()) {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
        console.log(`Cache memory limit reached, removed oldest entry: ${oldestKey}`);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.memoryUsage = 0;
  }
}

// Create singleton instance
export const spotCacheService = new SpotCacheService();

// Export functions that match the expected interface in locationSpotService.ts
export const getCachedSpots = (
  centerLat: number,
  centerLng: number,
  radius: number,
  limit: number
): any[] | null => {
  return spotCacheService.getCachedSpots(centerLat, centerLng, radius, limit);
};

export const cacheSpots = (
  centerLat: number,
  centerLng: number,
  radius: number,
  limit: number,
  spots: any[]
): void => {
  spotCacheService.cacheSpots(centerLat, centerLng, radius, limit, spots);
};
