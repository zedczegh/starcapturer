
import { Location, Language } from '../types';
import { findBestMatches, containsChineseCharacters } from '../matching';
import { findSmallTownMatches } from '../smallTownsDatabase';
import { findMatchingLocations } from '../locationDatabase';

/**
 * Fetch data from external source and process results
 */
export async function fetchAndProcessExternalResults(
  query: string, 
  language: Language,
  hasChineseChars: boolean
): Promise<Location[]> {
  // Check for small town matches first
  if (language === 'en') {
    const smallTownMatches = findSmallTownMatches(query);
    if (smallTownMatches.length > 0) {
      return smallTownMatches;
    }
  }

  // Use OpenStreetMap Nominatim API for geocoding
  const encodedQuery = encodeURIComponent(query);
  const languageParam = language === 'zh' ? '&accept-language=zh-CN' : '&accept-language=en';
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
  
  // Format the results with proper localization
  const locations: Location[] = results.map((item: any) => ({
    name: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    placeDetails: formatPlaceDetails(item, language)
  }));
  
  // Find the best matches for the query
  const bestMatches = findBestMatches(locations, query, language);
  
  // Combine with internal results if appropriate
  if (hasChineseChars || language === 'zh') {
    return combineDatabaseWithExternalResults(bestMatches, query, language);
  }
  
  return bestMatches;
}

/**
 * Format place details with proper localization
 */
function formatPlaceDetails(item: any, language: Language): string | undefined {
  if (!item.type || !item.class) {
    return undefined;
  }
  
  if (language === 'en') {
    return `${item.type} in ${item.class}`;
  } else {
    return `${item.class}中的${item.type}`;
  }
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
  
  // Combine and deduplicate
  const combined = [...internalResults, ...externalResults];
  
  // Remove duplicates by coordinates
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
