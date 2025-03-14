
import { Location, Language } from './types';
import { findBestMatches, containsChineseCharacters, checkAlternativeSpellings } from './matchingUtils';

/**
 * Search for locations matching the given query
 * @param query Search query string
 * @param language Language for the search results
 * @returns Promise resolving to an array of matching locations
 */
export async function searchLocations(
  query: string, 
  language: Language = 'en'
): Promise<Location[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    // Normalize query for comparison
    const lowercaseQuery = query.toLowerCase().trim();
    const hasChineseChars = containsChineseCharacters(lowercaseQuery);
    
    // For Chinese queries, first try to check our internal database
    // as it's better optimized for Chinese place names
    if (hasChineseChars || language === 'zh') {
      const alternativeResults = checkAlternativeSpellings(lowercaseQuery);
      
      if (alternativeResults.length > 0) {
        return alternativeResults;
      }
      
      // If we didn't find a match in our internal database,
      // also check the database for fallback options
      const { findMatchingLocations } = await import('./locationDatabase');
      const internalResults = findMatchingLocations(lowercaseQuery, 5, language);
      
      if (internalResults.length > 0) {
        return internalResults;
      }
    }
    
    // Special cases for common searches
    if (lowercaseQuery === 'cali' || 
        lowercaseQuery === 'ca' || 
        lowercaseQuery === 'calif' || 
        lowercaseQuery.startsWith('califo')) {
      // Prioritize California when these abbreviations are used
      return [
        {
          name: language === 'zh' ? '加利福尼亚州，美国' : 'California, USA',
          latitude: 36.7783,
          longitude: -119.4179,
          placeDetails: language === 'zh' ? '美国的一个州' : 'State in United States'
        }
      ];
    }
    
    // Use OpenStreetMap Nominatim API for geocoding
    const encodedQuery = encodeURIComponent(query);
    const languageParam = language === 'zh' ? '&accept-language=zh-CN' : '';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}${languageParam}&format=json&limit=10`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SIQSCalculatorApp'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}`);
    }
    
    const results = await response.json();
    
    // Format the results to match our Location type
    const locations: Location[] = results.map((item: any) => ({
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      placeDetails: item.type && item.class ? `${item.type} in ${item.class}` : undefined
    }));
    
    // Find the best matches for the query, considering the language
    return findBestMatches(locations, query, language);
  } catch (error) {
    console.error("Error searching for locations:", error);
    
    // Return a limited fallback based on the query matching from our database
    const { findMatchingLocations } = await import('./locationDatabase');
    return findMatchingLocations(query, 5, language);
  }
}
