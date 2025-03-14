
import { PersistentCache, globalCache } from './persistentCache';
import { Location, Language } from '../geocoding/types';

/**
 * Service for caching location search results
 */
export class SearchCacheService {
  private cache: PersistentCache;
  private localStorageEnabled: boolean;
  private CACHE_PREFIX = 'search-cache-';
  private MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(cache: PersistentCache = globalCache) {
    this.cache = cache;
    this.localStorageEnabled = this.checkLocalStorageAvailable();
  }

  /**
   * Check if localStorage is available
   */
  private checkLocalStorageAvailable(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      console.warn('localStorage not available for search caching');
      return false;
    }
  }

  /**
   * Generate a cache key for a search query
   */
  private getCacheKey(query: string, language: Language): string {
    return `search-${query.toLowerCase().trim()}-${language}`;
  }

  /**
   * Generate a localStorage key
   */
  private getLocalStorageKey(query: string, language: Language): string {
    return `${this.CACHE_PREFIX}${query.toLowerCase().trim()}-${language}`;
  }

  /**
   * Store search results in cache and localStorage
   */
  cacheSearchResults(query: string, language: Language, results: Location[]): void {
    const key = this.getCacheKey(query, language);
    
    // Cache in memory
    this.cache.set(key, results);
    
    // Cache in localStorage if available
    if (this.localStorageEnabled) {
      try {
        const cacheItem = {
          results,
          timestamp: Date.now()
        };
        localStorage.setItem(
          this.getLocalStorageKey(query, language), 
          JSON.stringify(cacheItem)
        );
      } catch (e) {
        console.warn('Failed to cache search results in localStorage', e);
      }
    }
  }

  /**
   * Get cached search results from memory or localStorage
   * @returns Cached results or null if not found or expired
   */
  getCachedResults(query: string, language: Language): Location[] | null {
    const key = this.getCacheKey(query, language);
    
    // Try in-memory cache first
    const memoryResults = this.cache.get<Location[]>(key);
    if (memoryResults) {
      return memoryResults;
    }
    
    // Try localStorage if available
    if (this.localStorageEnabled) {
      try {
        const storedItem = localStorage.getItem(this.getLocalStorageKey(query, language));
        if (storedItem) {
          const parsedItem = JSON.parse(storedItem);
          
          // Check if cache is still valid
          if (Date.now() - parsedItem.timestamp < this.MAX_CACHE_AGE_MS) {
            // Also update in-memory cache
            this.cache.set(key, parsedItem.results);
            return parsedItem.results;
          } else {
            // Remove expired cache
            localStorage.removeItem(this.getLocalStorageKey(query, language));
          }
        }
      } catch (e) {
        console.warn('Failed to retrieve search results from localStorage', e);
      }
    }
    
    return null;
  }

  /**
   * Clear all search cache
   */
  clearCache(): void {
    this.cache.clear();
    
    // Clear localStorage cache
    if (this.localStorageEnabled) {
      try {
        // Only remove items that start with our prefix
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.CACHE_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Failed to clear localStorage cache', e);
      }
    }
  }
  
  /**
   * Clean up expired cache items
   */
  cleanupExpiredItems(): void {
    if (this.localStorageEnabled) {
      try {
        const now = Date.now();
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.CACHE_PREFIX)) {
            const item = localStorage.getItem(key);
            if (item) {
              try {
                const parsedItem = JSON.parse(item);
                if (now - parsedItem.timestamp > this.MAX_CACHE_AGE_MS) {
                  localStorage.removeItem(key);
                }
              } catch (e) {
                // Invalid JSON, remove the item
                localStorage.removeItem(key);
              }
            }
          }
        });
      } catch (e) {
        console.warn('Failed to cleanup expired cache items', e);
      }
    }
  }
}

// Export a singleton instance
export const searchCache = new SearchCacheService();

// Periodically clean up expired cache items (every hour)
if (typeof window !== 'undefined') {
  setInterval(() => {
    searchCache.cleanupExpiredItems();
  }, 60 * 60 * 1000);
}
