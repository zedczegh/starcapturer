
import { useState } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Custom hook for memory caching with expiration
 */
export function useCache<T>(expirationMs: number = 60 * 60 * 1000) {
  // In-memory cache storage
  const [cache] = useState<Map<string, CacheItem<T>>>(new Map());

  /**
   * Set an item in cache
   */
  const setItem = (key: string, data: T): void => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  };

  /**
   * Get an item from cache if not expired
   */
  const getItem = (key: string): T | null => {
    const item = cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - item.timestamp > expirationMs) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  };

  /**
   * Remove item from cache
   */
  const removeItem = (key: string): void => {
    cache.delete(key);
  };

  /**
   * Clear entire cache
   */
  const clear = (): void => {
    cache.clear();
  };

  /**
   * Get cache size
   */
  const size = (): number => {
    return cache.size;
  };

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    size
  };
}
