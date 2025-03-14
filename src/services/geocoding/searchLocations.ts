
import { Location, Language } from './types';
import { findBestMatches } from './matchingUtils';

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
    
    // Special cases for common searches
    if (lowercaseQuery === 'cali' || 
        lowercaseQuery === 'ca' || 
        lowercaseQuery === 'calif' || 
        lowercaseQuery.startsWith('califo')) {
      // Prioritize California when these abbreviations are used
      return [
        {
          name: 'California, USA',
          latitude: 36.7783,
          longitude: -119.4179,
          placeDetails: 'State in United States'
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
    
    // Find the best matches for the query
    return findBestMatches(locations, query, language);
  } catch (error) {
    console.error("Error searching for locations:", error);
    
    // Return a limited fallback based on the query matching from our database
    const { findMatchingLocations } = await import('./locationDatabase');
    return findMatchingLocations(query, 5);
  }
}
