
import { Location, Language } from '../types';
import { searchCache } from '../../caching/searchCache';
import { searchWesternCities } from './westernCities';
import { handleChineseSearch } from './chineseSearch';
import { handleSpecialCases } from './specialCases';
import { fetchAndProcessExternalResults } from './externalSearch';
import { findMatchingLocations } from '../locationDatabase';
import { containsChineseCharacters } from '../matching';

/**
 * Optimized version of location search with better caching and error handling
 * @param query Search query string
 * @param language Language for the search results
 * @returns Promise resolving to an array of matching locations
 */
export async function searchLocations(
  query: string, 
  language: Language = 'en'
): Promise<Location[]> {
  // Short-circuit for empty queries
  if (!query?.trim()) return [];

  // Normalize query for comparison
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Try to get results from cache first
  const cachedResults = searchCache.getCachedResults(lowercaseQuery, language);
  if (cachedResults?.length > 0) {
    return cachedResults;
  }

  try {
    const hasChineseChars = containsChineseCharacters(lowercaseQuery);
    
    // Prioritize search methods based on query type
    let results: Location[] = [];
    
    // Method 1: Handle Chinese language searches
    if (hasChineseChars || language === 'zh') {
      results = await handleChineseSearch(lowercaseQuery, language);
      if (results.length > 0) {
        searchCache.cacheSearchResults(lowercaseQuery, language, results);
        return results;
      }
    }
    
    // Method 2: Handle English language searches efficiently
    if (language === 'en' && !hasChineseChars) {
      results = await searchWesternCities(lowercaseQuery);
      if (results.length > 0) {
        searchCache.cacheSearchResults(lowercaseQuery, language, results);
        return results;
      }
    }
    
    // Method 3: Handle special case searches
    results = handleSpecialCases(lowercaseQuery, language);
    if (results.length > 0) {
      searchCache.cacheSearchResults(lowercaseQuery, language, results);
      return results;
    }
    
    // Method 4: Fall back to external API search
    results = await fetchAndProcessExternalResults(lowercaseQuery, language, hasChineseChars);
    searchCache.cacheSearchResults(lowercaseQuery, language, results);
    return results;
  } catch (error) {
    console.error("Error searching for locations:", error);
    
    // Return a fallback from internal database
    const fallbackResults = findMatchingLocations(query, 5, language);
    searchCache.cacheSearchResults(lowercaseQuery, language, fallbackResults);
    return fallbackResults;
  }
}

// Export all search modules for direct access
export * from './westernCities';
export * from './chineseSearch';
export * from './specialCases';
export * from './externalSearch';
