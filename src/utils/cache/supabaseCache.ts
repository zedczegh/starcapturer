
/**
 * Specialized cache for Supabase data to improve loading performance
 */

import { CacheItem, DEFAULT_TTL, CacheOptions } from './cacheTypes';
import { getFromMemoryCache, setInMemoryCache } from './memoryCache';
import { getFromStorageCache, setInStorageCache } from './storageCache';

// Cache prefix to avoid conflicts
const SUPABASE_CACHE_PREFIX = 'supabase:';

/**
 * Generate a cache key for Supabase data
 */
export function generateSupabaseCacheKey(
  table: string,
  query: string | Record<string, any>,
  params?: Record<string, any>
): string {
  const queryStr = typeof query === 'string' ? query : JSON.stringify(query);
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${SUPABASE_CACHE_PREFIX}${table}:${queryStr}:${paramsStr}`;
}

/**
 * Get cached Supabase data with optimized access patterns
 */
export function getCachedSupabaseData<T>(
  table: string,
  query: string | Record<string, any>,
  params?: Record<string, any>
): T | null {
  const cacheKey = generateSupabaseCacheKey(table, query, params);
  
  // Try memory cache first (fastest)
  const memoryData = getFromMemoryCache<T>(cacheKey);
  if (memoryData) {
    return memoryData;
  }
  
  // Fall back to storage cache
  const storageData = getFromStorageCache<T>(cacheKey);
  if (storageData) {
    // Copy to memory for faster subsequent access
    setInMemoryCache(cacheKey, storageData, DEFAULT_TTL);
    return storageData;
  }
  
  return null;
}

/**
 * Cache Supabase data for faster access
 */
export function cacheSupabaseData<T>(
  table: string,
  query: string | Record<string, any>,
  data: T,
  options?: CacheOptions
): void {
  const {
    ttl = DEFAULT_TTL,
    persistToStorage = true,
    namespace = ''
  } = options || {};
  
  const cacheKey = generateSupabaseCacheKey(table, query, namespace ? { namespace } : undefined);
  
  // Always cache in memory
  setInMemoryCache(cacheKey, data, ttl);
  
  // Optionally persist to storage
  if (persistToStorage) {
    setInStorageCache(cacheKey, data, ttl);
  }
}

/**
 * Clear specific Supabase data from cache
 */
export function clearSupabaseCacheForTable(table: string): void {
  const prefix = `${SUPABASE_CACHE_PREFIX}${table}:`;
  
  // Clear from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
  
  // Clear from memory cache
  // This requires access to memory cache internals which we don't have directly
  // Instead, we'll initialize the cache on app startup
}
