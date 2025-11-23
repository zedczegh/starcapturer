/**
 * Centralized cache manager for the application
 * Handles caching with TTL (Time To Live) support
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>>;
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.DEFAULT_TTL);
    
    this.cache.set(key, {
      data,
      timestamp,
      expiresAt
    });
  }

  /**
   * Get data from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired
    };
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Cache key generators
export const CacheKeys = {
  mapLocations: (lat: number, lng: number, radius: number) => 
    `map:locations:${lat.toFixed(4)},${lng.toFixed(4)}:${radius}`,
  
  siqs: (lat: number, lng: number) => 
    `siqs:${lat.toFixed(6)},${lng.toFixed(6)}`,
  
  messages: (userId: string, page: number = 1) => 
    `messages:${userId}:${page}`,
  
  feeds: (userId: string, page: number = 1) => 
    `feeds:${userId}:${page}`,
  
  reverseGeocode: (lat: number, lng: number) =>
    `geocode:${lat.toFixed(6)},${lng.toFixed(6)}`,
  
  userProfile: (userId: string) => 
    `profile:${userId}`
};
