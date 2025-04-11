
import { Location, Language } from '../types';
import { getWesternCitiesDatabase } from './westernCities';
import { findSmallTownMatches } from '../../geocoding/smallTownsDatabase';

/**
 * Search for special cases like abbreviated forms or special keywords
 * @param query Search query
 * @param language User's preferred language
 * @returns Array of matching locations
 */
export async function searchSpecialCases(
  query: string, 
  language: Language
): Promise<Location[]> {
  // Normalize query
  const trimmedQuery = query.trim().toLowerCase();
  
  if (!trimmedQuery) return [];
  
  const specialResults = handleSpecialCases(trimmedQuery, language);
  return specialResults;
}

/**
 * Handle special case searches like abbreviated forms and dark sky locations
 */
export function handleSpecialCases(query: string, language: Language): Location[] {
  const westernCities = getWesternCitiesDatabase();
  
  // California abbreviations
  if (query === 'cali' || 
      query === 'ca' || 
      query === 'calif' || 
      query.startsWith('califo')) {
    return [westernCities['california']];
  }
  
  // Dark sky related queries
  if (query.includes('dark sky') || 
      query.includes('dark-sky') || 
      query.includes('ida') || 
      query.includes('international dark') || 
      (language === 'zh' && (
        query.includes('暗夜') || 
        query.includes('暗空'))
      )) {
    
    // Return special dark sky placeholder to trigger search for certified locations
    return [{
      name: "Dark Sky Locations",
      latitude: 0, // Will be replaced with actual locations
      longitude: 0,
      placeDetails: "Search for Dark Sky certified locations worldwide"
    }];
  }
  
  // Check if this could be a small town
  const smallTownMatches = findSmallTownMatches(query);
  if (smallTownMatches.length > 0) {
    return smallTownMatches;
  }
  
  return [];
}
