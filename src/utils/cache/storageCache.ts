
/**
 * Local storage cache implementation
 */

import type { CacheItem } from './cacheTypes';

const CACHE_PREFIX = 'cache:';

/**
 * Get item from local storage cache
 */
export function getFromStorageCache<T>(key: string): T | null {
  try {
    const storedItem = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (storedItem) {
      const parsed = JSON.parse(storedItem) as CacheItem<T>;
      if (parsed.expires > Date.now()) {
        return parsed.data;
      } else {
        // Remove expired item
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      }
    }
    return null;
  } catch (error) {
    console.error('Cache storage read error:', error);
    return null;
  }
}

/**
 * Add item to local storage cache
 */
export function setInStorageCache<T>(key: string, data: T, ttlMs: number): boolean {
  try {
    const now = Date.now();
    const expires = now + ttlMs;
    const item: CacheItem<T> = { 
      data, 
      timestamp: now,
      ttl: ttlMs,
      expires 
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    return true;
  } catch (e) {
    // Handle QuotaExceededError
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return false;
    }
    console.error('Error storing cache item:', e);
    return false;
  }
}

/**
 * Delete item from local storage cache
 */
export function deleteFromStorageCache(key: string): void {
  localStorage.removeItem(`${CACHE_PREFIX}${key}`);
}

/**
 * Clear storage cache with optional prefix
 */
export function clearStorageCache(prefix?: string): void {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      if (prefix) {
        if (key.startsWith(`${CACHE_PREFIX}${prefix}`)) {
          keysToRemove.push(key);
        }
      } else if (key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing storage cache:', error);
  }
}

/**
 * Clear oldest items when storage is full
 */
export function clearOldestCacheItems(): void {
  try {
    const cacheItems: Array<{ key: string; expires: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.expires) {
            cacheItems.push({ key, expires: item.expires });
          }
        } catch (e) {
          // Skip invalid items
          localStorage.removeItem(key);
        }
      }
    }
    
    // Sort by expiration (oldest first)
    cacheItems.sort((a, b) => a.expires - b.expires);
    
    // Remove oldest 20% of items
    const itemsToRemove = Math.ceil(cacheItems.length * 0.2);
    cacheItems.slice(0, itemsToRemove).forEach(item => {
      localStorage.removeItem(item.key);
    });
  } catch (error) {
    console.error('Error clearing oldest cache items:', error);
  }
}
