
/**
 * Enhanced caching utility with memory optimization and performance improvements
 */

// Typed cache item with expiration
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// In-memory cache with strong and weak references
class EnhancedCache {
  private strongCache: Map<string, CacheItem<any>>;
  private expiryTimes: Map<string, number>;
  private lastCleanup: number;
  private cleanupInterval: number;
  
  constructor(cleanupIntervalMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.strongCache = new Map();
    this.expiryTimes = new Map();
    this.lastCleanup = Date.now();
    this.cleanupInterval = cleanupIntervalMs;
  }
  
  /**
   * Get cached item if it exists and isn't expired
   */
  get<T>(key: string): T | null {
    // Run cleanup if needed
    this.conditionalCleanup();
    
    const item = this.strongCache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now > item.expiry) {
      this.strongCache.delete(key);
      this.expiryTimes.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  /**
   * Store item in cache with expiration
   */
  set<T>(key: string, data: T, ttlMs: number = 30 * 60 * 1000): void {
    const now = Date.now();
    const expiry = now + ttlMs;
    
    this.strongCache.set(key, {
      data,
      timestamp: now,
      expiry
    });
    
    this.expiryTimes.set(key, expiry);
    this.conditionalCleanup();
  }
  
  /**
   * Remove specific item from cache
   */
  delete(key: string): boolean {
    this.expiryTimes.delete(key);
    return this.strongCache.delete(key);
  }
  
  /**
   * Clear all cached items
   */
  clear(): void {
    this.strongCache.clear();
    this.expiryTimes.clear();
  }
  
  /**
   * Run cleanup if enough time has passed since last cleanup
   */
  private conditionalCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.cleanup();
      this.lastCleanup = now;
    }
  }
  
  /**
   * Remove expired items from cache
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    // Use the expiry index for faster expiration checks
    for (const [key, expiry] of this.expiryTimes.entries()) {
      if (now > expiry) {
        this.strongCache.delete(key);
        this.expiryTimes.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`Cache cleanup: removed ${expiredCount} expired items`);
    }
  }
  
  // Add entries method for iteration
  entries(): IterableIterator<[string, CacheItem<any>]> {
    return this.strongCache.entries();
  }
}

// Create singleton instance
const globalCache = new EnhancedCache();

/**
 * Fetch with enhanced caching
 */
export async function fetchWithEnhancedCache<T>(
  url: string,
  options?: RequestInit,
  cacheDuration = 30 * 60 * 1000
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options || {})}`;
  
  // Check cache first
  const cachedData = globalCache.get<T>(cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }
  
  // Perform fetch if not in cache
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  
  const data = await response.json() as T;
  
  // Store in cache
  globalCache.set(cacheKey, data, cacheDuration);
  
  return data;
}

/**
 * Clear specified URLs from cache
 */
export function clearCacheForUrls(urlPatterns: string[]): void {
  for (const pattern of urlPatterns) {
    // Implement basic pattern matching (starts with)
    for (const [key] of globalCache.entries()) {
      if (key.startsWith(pattern)) {
        globalCache.delete(key);
      }
    }
  }
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  globalCache.clear();
}
