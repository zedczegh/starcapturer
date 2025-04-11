
import { Location, Language } from './types';

/**
 * Mock function to find matching locations based on search query
 * This is a temporary placeholder until we properly refactor the geocoding services
 */
export function findMatchingLocations(
  query: string, 
  limit: number = 10, 
  language: Language = 'en'
): Location[] {
  // Return an empty array for now as this is a placeholder
  console.warn('Using placeholder findMatchingLocations function');
  return [];
}
