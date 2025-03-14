
import { Location, Language } from './types';
import { findBestMatches, containsChineseCharacters, checkAlternativeSpellings } from './matchingUtils';
import { findMatchingLocations } from './locationDatabase';

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
    
    // Immediately check for specific Chinese locations
    if (hasChineseChars || language === 'zh') {
      // Special Chinese location checks with higher priority
      if (lowercaseQuery.includes('徐汇') || lowercaseQuery === 'xuhui' || lowercaseQuery === 'xu hui') {
        return checkAlternativeSpellings('徐汇');
      }
      
      if (lowercaseQuery.includes('南明') || lowercaseQuery === 'nanming' || lowercaseQuery === 'nan ming') {
        return checkAlternativeSpellings('南明');
      }
      
      if (lowercaseQuery.includes('都匀') || lowercaseQuery === 'duyun' || lowercaseQuery === 'du yun') {
        return checkAlternativeSpellings('都匀');
      }
      
      // Check for other alternative spellings
      const alternativeResults = checkAlternativeSpellings(lowercaseQuery);
      
      if (alternativeResults.length > 0) {
        return alternativeResults;
      }
      
      // Check the internal database for Chinese locations
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
    const bestMatches = findBestMatches(locations, query, language);
    
    // If searching in Chinese or with Chinese characters, try to combine with our internal database results
    if (hasChineseChars || language === 'zh') {
      const internalResults = findMatchingLocations(lowercaseQuery, 3, language);
      
      // Combine and sort by relevance
      const combined = [...internalResults, ...bestMatches];
      
      // Remove duplicates (basic deduplication by coordinates)
      const uniqueResults: Location[] = [];
      const seenCoords = new Set<string>();
      
      for (const loc of combined) {
        const coordKey = `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;
        if (!seenCoords.has(coordKey)) {
          uniqueResults.push(loc);
          seenCoords.add(coordKey);
        }
      }
      
      return uniqueResults;
    }
    
    return bestMatches;
  } catch (error) {
    console.error("Error searching for locations:", error);
    
    // Return a fallback based on internal database
    return findMatchingLocations(query, 5, language);
  }
}
