
import { Location, Language } from '../types';
import { getWesternCitiesDatabase } from './westernCities';

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
