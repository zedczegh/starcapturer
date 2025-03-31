
import { Location, Language } from '../types';
import { searchCache } from '../../caching/searchCache';
import { findMatchingLocations } from '../locationDatabase';
import { containsChineseCharacters } from '../matching';

/**
 * Optimized location search with better caching and error handling
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
    
    // Simplified search strategy - use the built-in database first
    const results = findMatchingLocations(lowercaseQuery, 10, language);
    
    if (results.length > 0) {
      searchCache.cacheResults(lowercaseQuery, results, language);
      return results;
    }
    
    // Handle the case where no results were found
    return [];
  } catch (error) {
    console.error("Error searching for locations:", error);
    
    // Return a fallback from internal database
    const fallbackResults = findMatchingLocations(query, 5, language);
    searchCache.cacheResults(lowercaseQuery, fallbackResults, language);
    return fallbackResults;
  }
}
