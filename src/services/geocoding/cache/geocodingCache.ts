
/**
 * Simple cache implementation for geocoding results
 */

// Define the type for cached items
interface CacheItem {
  value: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Cache storage
const cache: Record<string, CacheItem> = {};

/**
 * Add data to the cache with a TTL (default 24 hours)
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in milliseconds (default: 24 hours)
 */
export function addToCache(key: string, value: any, ttl = 24 * 60 * 60 * 1000): void {
  cache[key] = {
    value,
    timestamp: Date.now(),
    ttl
  };
}

/**
 * Get data from cache if still valid
 * @param key Cache key
 * @returns Cached value or undefined if expired or not found
 */
export function getFromCache(key: string): any | undefined {
  const item = cache[key];
  if (!item) return undefined;
  
  // Check if item has expired
  if (Date.now() - item.timestamp > item.ttl) {
    // Remove expired item
    delete cache[key];
    return undefined;
  }
  
  return item.value;
}

/**
 * Clear all cached items or items matching a key prefix
 * @param keyPrefix Optional prefix to limit which items to clear
 */
export function clearCache(keyPrefix?: string): void {
  if (keyPrefix) {
    Object.keys(cache).forEach(key => {
      if (key.startsWith(keyPrefix)) {
        delete cache[key];
      }
    });
  } else {
    Object.keys(cache).forEach(key => delete cache[key]);
  }
}

/**
 * Get cache size (number of items)
 * @returns Number of cached items
 */
export function getCacheSize(): number {
  return Object.keys(cache).length;
}

/**
 * Export types for use in other files
 */
export type GeocodeCache = typeof cache;
