
import { useState, useEffect } from 'react';

/**
 * Simple in-memory cache with expiration
 * @param defaultExpirationMs Default cache item expiration time in milliseconds
 * @returns Cache API
 */
export function useCache<T = any>(defaultExpirationMs: number = 5 * 60 * 1000) {
  // Use a Map to store cache items with their expiration
  const [cache] = useState<Map<string, { data: T; expiry: number }>>(new Map());

  // Clean up expired items periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      
      for (const [key, value] of cache.entries()) {
        if (now > value.expiry) {
          cache.delete(key);
        }
      }
    }, 60000); // Run every minute
    
    return () => clearInterval(intervalId);
  }, [cache]);

  /**
   * Store an item in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param expirationMs Optional custom expiration time
   */
  const setItem = (key: string, data: T, expirationMs?: number) => {
    const expiry = Date.now() + (expirationMs || defaultExpirationMs);
    cache.set(key, { data, expiry });
  };

  /**
   * Get an item from cache if it exists and hasn't expired
   * @param key Cache key
   * @param maxAgeMs Optional maximum age override
   * @returns Cached data or null
   */
  const getItem = (key: string, maxAgeMs?: number): T | null => {
    const item = cache.get(key);
    
    // Check if item exists and isn't expired
    if (item) {
      const now = Date.now();
      
      // If maxAgeMs is specified, use it to determine if item is still valid
      const expiryTime = maxAgeMs ? (item.expiry - defaultExpirationMs + maxAgeMs) : item.expiry;
      
      if (now < expiryTime) {
        return item.data;
      } else {
        // Remove expired item
        cache.delete(key);
      }
    }
    
    return null;
  };

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  const removeItem = (key: string) => {
    cache.delete(key);
  };

  /**
   * Clear all items from the cache
   */
  const clear = () => {
    cache.clear();
  };

  /**
   * Get the current size of the cache
   * @returns Number of items in cache
   */
  const size = () => {
    return cache.size;
  };

  return { getItem, setItem, removeItem, clear, size };
}
