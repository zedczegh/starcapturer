
/**
 * Optimized cache utility with memory and persistence layers
 * Improves application performance by reducing API calls and calculations
 */

import { 
  getFromMemoryCache, 
  setInMemoryCache, 
  deleteFromMemoryCache, 
  clearMemoryCache
} from './cache/memoryCache';

import {
  getFromStorageCache,
  setInStorageCache,
  deleteFromStorageCache,
  clearStorageCache,
  clearOldestCacheItems
} from './cache/storageCache';

import {
  DEFAULT_TTL
} from './cache/cacheTypes';

import type { CacheOptions } from './cache/cacheTypes';

/**
 * Get item from cache with fast access
 * @param key Cache key
 * @returns Cached item or null if not found/expired
 */
export function getCachedItem<T>(key: string): T | null {
  try {
    // Check memory cache first for fastest performance
    const memoryItem = getFromMemoryCache<T>(key);
    if (memoryItem !== null) {
      return memoryItem;
    }
    
    // If not in memory, try localStorage
    const storageItem = getFromStorageCache<T>(key);
    if (storageItem !== null) {
      // Add to memory cache for faster subsequent access
      setInMemoryCache(key, storageItem, DEFAULT_TTL);
      return storageItem;
    }
    
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Store item in cache
 * @param key Cache key
 * @param data Data to store
 * @param ttlMs Time to live in milliseconds
 */
export function setCachedItem<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
  try {
    // Store in memory cache first
    setInMemoryCache(key, data, ttlMs);
    
    // Then persist to localStorage if available
    const storageSuccess = setInStorageCache(key, data, ttlMs);
    if (!storageSuccess) {
      // Handle storage quota exceeded
      clearOldestCacheItems();
      setInStorageCache(key, data, ttlMs);
    }
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Clear specific cache item
 */
export function clearCacheItem(key: string): void {
  deleteFromMemoryCache(key);
  deleteFromStorageCache(key);
}

/**
 * Clear all cache items with optional prefix
 */
export function clearCache(prefix?: string): void {
  // Clear from memory
  clearMemoryCache(prefix);
  
  // Clear from localStorage
  clearStorageCache(prefix);
}

/**
 * Initialize cache from localStorage on startup
 */
export function initializeCache(): void {
  try {
    let restoredCount = 0;
    
    // Only load unexpired items from localStorage to memory cache
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache:')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.expires && item.expires > Date.now()) {
            const memoryKey = key.replace('cache:', '');
            setInMemoryCache(memoryKey, item.data, item.expires - Date.now());
            restoredCount++;
          } else {
            // Remove expired items
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Skip invalid items
          localStorage.removeItem(key);
        }
      }
    }
    
    console.log(`Initialized cache with ${restoredCount} valid items`);
  } catch (error) {
    console.error('Error initializing cache:', error);
  }
}

// Initialize cache on module load if in browser environment
if (typeof window !== 'undefined') {
  initializeCache();
}
