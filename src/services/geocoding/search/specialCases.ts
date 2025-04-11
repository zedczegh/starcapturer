
import { Location, Language } from '../types';
import { getWesternCitiesDatabase } from './westernCities';

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
 * Handle special case searches like abbreviated forms
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
  
  return [];
}

