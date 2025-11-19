/**
 * Unified cache utility combining memory and persistent storage
 * Optimized for performance and storage efficiency
 */

const memCache = new Map<string, any>();
const expiryMap = new Map<string, number>();

const CACHE_PREFIX = 'app:';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_MEMORY_ITEMS = 200; // Limit memory cache size

/**
 * Get item from cache (memory-first, then storage)
 */
export function getCache<T>(key: string): T | null {
  try {
    // Check memory cache first
    if (memCache.has(key)) {
      const expiry = expiryMap.get(key) || 0;
      if (expiry > Date.now()) {
        return memCache.get(key) as T;
      }
      memCache.delete(key);
      expiryMap.delete(key);
    }

    // Check localStorage
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (stored) {
      const { value, expiry } = JSON.parse(stored);
      if (expiry > Date.now()) {
        // Restore to memory
        memCache.set(key, value);
        expiryMap.set(key, expiry);
        return value as T;
      }
      localStorage.removeItem(CACHE_PREFIX + key);
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
}

/**
 * Set item in cache (both memory and storage)
 */
export function setCache<T>(key: string, value: T, ttl = DEFAULT_TTL): void {
  try {
    const expiry = Date.now() + ttl;
    
    // Limit memory cache size
    if (memCache.size >= MAX_MEMORY_ITEMS) {
      const oldestKey = memCache.keys().next().value;
      memCache.delete(oldestKey);
      expiryMap.delete(oldestKey);
    }
    
    memCache.set(key, value);
    expiryMap.set(key, expiry);
    
    // Store persistently
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, expiry }));
    } catch (storageError) {
      // Handle quota exceeded
      if (storageError instanceof DOMException) {
        clearExpiredCache();
      }
    }
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

/**
 * Remove item from cache
 */
export function removeCache(key: string): void {
  memCache.delete(key);
  expiryMap.delete(key);
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (e) {
    console.error('Cache remove error:', e);
  }
}

/**
 * Clear all cache or by prefix
 */
export function clearCache(prefix?: string): void {
  if (prefix) {
    // Clear with prefix
    for (const key of memCache.keys()) {
      if (key.startsWith(prefix)) {
        memCache.delete(key);
        expiryMap.delete(key);
      }
    }
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX + prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Cache clear error:', e);
    }
  } else {
    // Clear all
    memCache.clear();
    expiryMap.clear();
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Cache clear error:', e);
    }
  }
}

/**
 * Clear expired items from storage
 */
function clearExpiredCache(): void {
  const now = Date.now();
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '');
          if (item.expiry <= now) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (e) {
    console.error('Cache cleanup error:', e);
  }
}

/**
 * Check if cache has valid item
 */
export function hasCache(key: string): boolean {
  const item = getCache(key);
  return item !== null;
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memCache.clear();
    expiryMap.clear();
  });
}
