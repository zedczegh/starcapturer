
/**
 * In-memory cache implementation
 */

import type { CacheItem } from './cacheTypes';

// In-memory cache for fastest access
const memoryCache = new Map<string, CacheItem<any>>();

/**
 * Get item from memory cache
 */
export function getFromMemoryCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (item && item.expires > Date.now()) {
    return item.data as T;
  }
  return null;
}

/**
 * Add item to memory cache
 */
export function setInMemoryCache<T>(key: string, data: T, ttlMs: number): void {
  const expires = Date.now() + ttlMs;
  memoryCache.set(key, { data, expires });
}

/**
 * Delete item from memory cache
 */
export function deleteFromMemoryCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Clear memory cache with optional prefix
 */
export function clearMemoryCache(prefix?: string): void {
  if (prefix) {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  } else {
    memoryCache.clear();
  }
}

/**
 * Get the memory cache size
 */
export function memoryCacheSize(): number {
  return memoryCache.size;
}

/**
 * Get all keys in memory cache
 */
export function memoryCacheKeys(): string[] {
  return Array.from(memoryCache.keys());
}
