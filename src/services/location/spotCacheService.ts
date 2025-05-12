
// Cache service for storing and retrieving spot data with optimized memory usage

const SPOT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100; // Prevent memory leaks

class SpotCacheService {
  private cache: Map<string, { spots: any[]; timestamp: number }>;
  
  constructor() {
    this.cache = new Map();
  }

  private cleanOldEntries() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > SPOT_CACHE_DURATION) {
        this.cache.delete(key);
      }
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
    this.cache.set(cacheKey, {
      spots,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Create singleton instance
const spotCacheService = new SpotCacheService();

// Export both the class and the singleton instance
export { spotCacheService };

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
