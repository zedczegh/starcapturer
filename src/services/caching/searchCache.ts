
import { Location, Language } from "../geocoding/types";

const CACHE_PREFIX = "siqs_search_";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class SearchCacheService {
  private getCacheKey(query: string, language: Language): string {
    return `${CACHE_PREFIX}${language}_${query.toLowerCase().trim()}`;
  }

  getCachedResults(query: string, language: Language): Location[] | null {
    try {
      const cacheKey = this.getCacheKey(query, language);
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const { results, timestamp } = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return results;
    } catch (error) {
      console.error("Error retrieving cached search results:", error);
      return null;
    }
  }

  cacheResults(query: string, results: Location[], language: Language): void {
    try {
      if (!results || results.length === 0) return;
      
      const cacheKey = this.getCacheKey(query, language);
      const cacheData = {
        results,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error caching search results:", error);
    }
  }

  clearCache(): void {
    try {
      // Clear all search cache entries
      Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error("Error clearing search cache:", error);
    }
  }
}

export const searchCache = new SearchCacheService();
