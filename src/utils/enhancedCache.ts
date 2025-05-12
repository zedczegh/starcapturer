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
  private frequencyMap: Map<string, number>; // Track access frequency
  private lastCleanup: number;
  private cleanupInterval: number;
  
  constructor(cleanupIntervalMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.strongCache = new Map();
    this.expiryTimes = new Map();
    this.frequencyMap = new Map();
    this.lastCleanup = Date.now();
    this.cleanupInterval = cleanupIntervalMs;
  }
  
  /**
   * Get cached item if it exists and isn't expired
   */
  get<T>(key: string): T | null {
    // Run cleanup if needed - but use light cleanup for faster response
    this.conditionalLightCleanup();
    
    const item = this.strongCache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now > item.expiry) {
      this.strongCache.delete(key);
      this.expiryTimes.delete(key);
      this.frequencyMap.delete(key);
      return null;
    }
    
    // Update access frequency
    this.frequencyMap.set(key, (this.frequencyMap.get(key) || 0) + 1);
    
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
    this.frequencyMap.set(key, this.frequencyMap.get(key) || 0);
    this.conditionalLightCleanup();
  }
  
  /**
   * Remove specific item from cache
   */
  delete(key: string): boolean {
    this.expiryTimes.delete(key);
    this.frequencyMap.delete(key);
    return this.strongCache.delete(key);
  }
  
  /**
   * Clear all cached items
   */
  clear(): void {
    this.strongCache.clear();
    this.expiryTimes.clear();
    this.frequencyMap.clear();
  }
  
  /**
   * Run only essential cleanup if enough time has passed
   * This is faster than full cleanup
   */
  private conditionalLightCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      // Only clean expired items to keep it fast
      this.lightCleanup();
      this.lastCleanup = now;
    }
  }
  
  /**
   * Clean up only expired items for faster performance
   */
  private lightCleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    // Fast expiration check
    for (const [key, expiry] of this.expiryTimes.entries()) {
      if (now > expiry) {
        this.strongCache.delete(key);
        this.expiryTimes.delete(key);
        this.frequencyMap.delete(key);
        expiredCount++;
      }
    }
  }
  
  /**
   * Full cleanup including cache size management
   * Called less frequently to manage cache size
   */
  runFullCleanup(maxItems: number = 100): void {
    const now = Date.now();
    
    // First remove expired items
    this.lightCleanup();
    
    // If still too many items, remove least frequently accessed
    if (this.strongCache.size > maxItems) {
      // Convert to array for sorting
      const entries = Array.from(this.frequencyMap.entries());
      
      // Sort by frequency ascending (least used first)
      entries.sort((a, b) => a[1] - b[1]);
      
      // Remove least used items
      const itemsToRemove = entries.slice(0, entries.length - maxItems);
      for (const [key] of itemsToRemove) {
        this.delete(key);
      }
    }
    
    this.lastCleanup = now;
  }
  
  // Add entries method for iteration
  entries(): IterableIterator<[string, CacheItem<any>]> {
    return this.strongCache.entries();
  }
}

// Create singleton instance
const globalCache = new EnhancedCache();

// Run full cleanup periodically
if (typeof window !== 'undefined') {
  // Run full cleanup less frequently in the background
  setInterval(() => {
    try {
      globalCache.runFullCleanup();
    } catch (e) {
      console.error("Cache cleanup error:", e);
    }
  }, 30 * 60 * 1000); // 30 minutes
}

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

/**
 * Prefetch data and store in cache
 * This can be used to preload resources for faster access
 */
export async function prefetchData<T>(
  url: string,
  options?: RequestInit,
  cacheDuration = 30 * 60 * 1000
): Promise<T | null> {
  try {
    const data = await fetchWithEnhancedCache<T>(url, options, cacheDuration);
    return data;
  } catch (error) {
    console.error(`Error prefetching ${url}:`, error);
    return null;
  }
}
