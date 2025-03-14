import { Location, Language } from './types';
import { findBestMatches, containsChineseCharacters } from './matchingUtils';
import { findMatchingLocations } from './locationDatabase';
import { checkAlternativeSpellings } from './chineseCityData';
import { findSmallTownMatches } from './smallTownsDatabase';

// Enhanced western cities database with improved search terms
const westernCities: Record<string, Location> = {
  'new york': {
    name: 'New York City, USA',
    placeDetails: 'Major city in United States',
    latitude: 40.7128,
    longitude: -74.0060
  },
  'london': {
    name: 'London, United Kingdom',
    placeDetails: 'Capital city of United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278
  },
  'paris': {
    name: 'Paris, France',
    placeDetails: 'Capital city of France',
    latitude: 48.8566,
    longitude: 2.3522
  },
  'sydney': {
    name: 'Sydney, Australia',
    placeDetails: 'Major city in Australia',
    latitude: -33.8688,
    longitude: 151.2093
  },
  'los angeles': {
    name: 'Los Angeles, USA',
    placeDetails: 'Major city in California, United States',
    latitude: 34.0522,
    longitude: -118.2437
  },
  'new castle': {
    name: 'Newcastle upon Tyne, UK',
    placeDetails: 'City in Northern England',
    latitude: 54.9783,
    longitude: -1.6178
  },
  'newcastle': {
    name: 'Newcastle upon Tyne, UK',
    placeDetails: 'City in Northern England',
    latitude: 54.9783,
    longitude: -1.6178
  },
  'california': {
    name: 'California, USA',
    placeDetails: 'State in United States',
    latitude: 36.7783,
    longitude: -119.4179
  },
  'denmark': {
    name: 'Denmark',
    placeDetails: 'Country in Northern Europe',
    latitude: 56.2639,
    longitude: 9.5018
  }
};

// Search term aliases to recognize different forms
const searchAliases: Record<string, string[]> = {
  'new castle': ['newcastle', 'newcastle upon tyne'],
  'newcastle': ['new castle', 'newcastle upon tyne'],
  'california': ['ca', 'calif', 'cali'],
  'ca': ['california', 'calif', 'cali'],
  'cali': ['california', 'ca', 'calif'],
  'calif': ['california', 'ca', 'cali'],
  'new york': ['ny', 'nyc'],
  'ny': ['new york', 'nyc'],
  'los angeles': ['la', 'los angeles ca'],
  'denmark': ['danish']
};

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
    
    // Handle English language searches efficiently
    if (language === 'en' && !hasChineseChars) {
      // First check for small towns with famous names
      const smallTownResults = findSmallTownMatches(lowercaseQuery, language);
      
      // Check exact matches for major cities
      if (westernCities[lowercaseQuery]) {
        // If we have both a major city match and small town matches with the same name,
        // combine them with the major city first
        if (smallTownResults.length > 0) {
          return [westernCities[lowercaseQuery], ...smallTownResults];
        }
        return [westernCities[lowercaseQuery]];
      }
      
      // Check for alias matches
      const aliasMatch = findAliasMatch(lowercaseQuery);
      if (aliasMatch) {
        // Combine with small town results if available
        if (smallTownResults.length > 0) {
          return [westernCities[aliasMatch], ...smallTownResults];
        }
        return [westernCities[aliasMatch]];
      }
      
      // If we have small town matches, return them now
      if (smallTownResults.length > 0) {
        return smallTownResults;
      }
      
      // Check for partial matches with western cities database
      const westernMatches = findPartialMatches(lowercaseQuery);
      if (westernMatches.length > 0) {
        return westernMatches;
      }
    }
    
    // Handle Chinese language searches
    if (hasChineseChars || language === 'zh') {
      // Check for Chinese location matches
      const chineseResults = await handleChineseSearch(lowercaseQuery, language);
      if (chineseResults.length > 0) {
        return chineseResults;
      }
    }
    
    // Handle special case searches
    const specialCaseResult = handleSpecialCases(lowercaseQuery, language);
    if (specialCaseResult.length > 0) {
      return specialCaseResult;
    }
    
    // Fall back to external API search
    return await fetchAndProcessExternalResults(lowercaseQuery, language, hasChineseChars);
  } catch (error) {
    console.error("Error searching for locations:", error);
    
    // Return a fallback from internal database
    return findMatchingLocations(query, 5, language);
  }
}

/**
 * Find matching aliases for the search term
 */
function findAliasMatch(query: string): string | null {
  // Check if this query is a direct alias
  for (const [key, aliases] of Object.entries(searchAliases)) {
    if (aliases.includes(query)) {
      return key;
    }
  }
  
  // Check if this query is a key with aliases
  if (searchAliases[query]) {
    return query;
  }
  
  return null;
}

/**
 * Find partial matches within the western cities database
 */
function findPartialMatches(query: string): Location[] {
  const results: Location[] = [];
  const words = query.split(' ');
  
  // Check for matches with parts of city names
  for (const [key, city] of Object.entries(westernCities)) {
    // Direct substring match
    if (key.includes(query) || query.includes(key)) {
      results.push(city);
      continue;
    }
    
    // Word-level matching
    const keyWords = key.split(' ');
    const hasWordMatch = words.some(word => 
      keyWords.some(keyWord => 
        keyWord.includes(word) || word.includes(keyWord)
      )
    );
    
    if (hasWordMatch) {
      results.push(city);
    }
  }
  
  // Also check small town matches
  const smallTownMatches = findSmallTownMatches(query);
  
  // Combine results, prioritizing major cities
  return [...results, ...smallTownMatches];
}

/**
 * Handle Chinese language search
 */
async function handleChineseSearch(query: string, language: Language): Promise<Location[]> {
  // Check for special Chinese locations
  const specialLocation = await checkSpecialChineseLocations(query);
  if (specialLocation.length > 0) {
    return specialLocation;
  }
  
  // Check for alternative spellings
  const alternativeResults = checkAlternativeSpellings(query);
  if (alternativeResults.length > 0) {
    return alternativeResults;
  }
  
  // Check internal database
  const internalResults = findMatchingLocations(query, 5, language);
  if (internalResults.length > 0) {
    return internalResults;
  }
  
  return [];
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
function handleSpecialCases(query: string, language: Language): Location[] {
  // California abbreviations
  if (query === 'cali' || 
      query === 'ca' || 
      query === 'calif' || 
      query.startsWith('califo')) {
    return [westernCities['california']];
  }
  
  return [];
}

/**
 * Fetch data from external source and process results
 */
async function fetchAndProcessExternalResults(
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
