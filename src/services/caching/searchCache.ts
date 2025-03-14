
import { PersistentCache, globalCache } from './persistentCache';
import { Location, Language } from '../geocoding/types';

/**
 * Service for caching location search results
 */
export class SearchCacheService {
  private cache: PersistentCache;

  constructor(cache: PersistentCache = globalCache) {
    this.cache = cache;
  }

  /**
   * Generate a cache key for a search query
   */
  private getCacheKey(query: string, language: Language): string {
    return `search-${query.toLowerCase().trim()}-${language}`;
  }

  /**
   * Store search results in cache
   */
  cacheSearchResults(query: string, language: Language, results: Location[]): void {
    const key = this.getCacheKey(query, language);
    this.cache.set(key, results);
  }

  /**
   * Get cached search results
   * @returns Cached results or null if not found
   */
  getCachedResults(query: string, language: Language): Location[] | null {
    const key = this.getCacheKey(query, language);
    return this.cache.get<Location[]>(key);
  }

  /**
   * Clear all search cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const searchCache = new SearchCacheService();
