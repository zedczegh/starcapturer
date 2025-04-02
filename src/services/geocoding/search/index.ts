
import { Location, Language } from '../types';
import { searchCache } from '../../caching/searchCache';
import { findMatchingLocations } from '../locationDatabase';
import { containsChineseCharacters } from '../matching';

/**
 * Enhanced location search with better caching, error handling, and fallbacks
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
    console.log(`Using ${cachedResults.length} cached search results for "${lowercaseQuery}"`);
    return cachedResults;
  }

  try {
    const hasChineseChars = containsChineseCharacters(lowercaseQuery);
    
    // Fast database search approach
    let results = findMatchingLocations(lowercaseQuery, 15, language);
    
    if (results.length === 0) {
      // If exact search fails, try partial matching with more flexible parameters
      console.log(`No results for "${lowercaseQuery}", trying partial matching`);
      
      // Split query into components and search for each
      const queryParts = lowercaseQuery.split(/[\s,]+/).filter(part => part.length > 2);
      
      if (queryParts.length > 1) {
        // Try each part of the query
        for (const part of queryParts) {
          const partialResults = findMatchingLocations(part, 5, language);
          results = [...results, ...partialResults];
          
          if (results.length >= 10) break; // Stop if we have enough results
        }
      }
      
      // Try with relaxed token matching if still no results
      if (results.length === 0) {
        console.log(`Still no results, trying more relaxed matching for "${lowercaseQuery}"`);
        
        const relaxedResults = findMatchingLocations(lowercaseQuery, 20, language, true);
        results = [...results, ...relaxedResults];
      }
    }
    
    // De-duplicate results based on coordinates
    const uniqueResults = Array.from(
      new Map(results.map(item => [`${item.latitude.toFixed(4)}-${item.longitude.toFixed(4)}`, item])).values()
    );
    
    if (uniqueResults.length > 0) {
      console.log(`Found ${uniqueResults.length} unique locations for "${lowercaseQuery}"`);
      searchCache.cacheResults(lowercaseQuery, uniqueResults, language);
      return uniqueResults;
    }
    
    // Handle the case where no results were found
    console.log(`No locations found for "${lowercaseQuery}" in any search method`);
    return [];
  } catch (error) {
    console.error(`Error searching for locations with query "${lowercaseQuery}":`, error);
    
    // Return a fallback from internal database with a very basic search
    const fallbackResults = findMatchingLocations(query, 5, language, true);
    if (fallbackResults.length > 0) {
      searchCache.cacheResults(lowercaseQuery, fallbackResults, language);
    }
    return fallbackResults;
  }
}
