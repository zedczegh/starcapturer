
import { Location, Language } from './types';
import { findBestMatches, containsChineseCharacters } from './matchingUtils';
import { findMatchingLocations, checkAlternativeSpellings } from './locationDatabase';

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
    
    // Immediately check for specific Chinese locations and alternative spellings
    if (hasChineseChars || language === 'zh') {
      // Check for key Chinese locations with higher priority
      const specialLocation = await checkSpecialChineseLocations(lowercaseQuery);
      if (specialLocation.length > 0) {
        return specialLocation;
      }
      
      // Check for alternative spellings
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
    
    // Handle special cases
    const specialCaseResults = handleSpecialCases(lowercaseQuery, language);
    if (specialCaseResults) {
      return specialCaseResults;
    }
    
    return await fetchAndProcessExternalResults(lowercaseQuery, language, hasChineseChars);
  } catch (error) {
    console.error("Error searching for locations:", error);
    
    // Return a fallback based on internal database
    return findMatchingLocations(query, 5, language);
  }
}

/**
 * Check for special Chinese locations that need specific handling
 */
async function checkSpecialChineseLocations(query: string): Promise<Location[]> {
  // Special Chinese location checks with higher priority
  if (query.includes('徐汇') || query === 'xuhui' || query === 'xu hui') {
    return checkAlternativeSpellings('徐汇');
  }
  
  if (query.includes('南明') || query === 'nanming' || query === 'nan ming') {
    return checkAlternativeSpellings('南明');
  }
  
  if (query.includes('都匀') || query === 'duyun' || query === 'du yun') {
    return checkAlternativeSpellings('都匀');
  }
  
  return [];
}

/**
 * Handle special case searches like abbreviated forms
 */
function handleSpecialCases(query: string, language: Language): Location[] | null {
  if (query === 'cali' || 
      query === 'ca' || 
      query === 'calif' || 
      query.startsWith('califo')) {
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
  
  return null;
}

/**
 * Fetch data from external source and process results
 */
async function fetchAndProcessExternalResults(
  query: string, 
  language: Language,
  hasChineseChars: boolean
): Promise<Location[]> {
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
  
  // If searching in Chinese or with Chinese characters, combine with internal database
  if (hasChineseChars || language === 'zh') {
    return combineDatabaseWithExternalResults(bestMatches, query, language);
  }
  
  return bestMatches;
}

/**
 * Combine internal database results with external API results
 */
function combineDatabaseWithExternalResults(
  externalResults: Location[], 
  query: string, 
  language: Language
): Location[] {
  const internalResults = findMatchingLocations(query.toLowerCase().trim(), 3, language);
  
  // Combine and sort by relevance
  const combined = [...internalResults, ...externalResults];
  
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
