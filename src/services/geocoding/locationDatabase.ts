
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

/**
 * Find location details by coordinates
 */
export function findLocationByCoordinates(
  latitude: number,
  longitude: number,
  language: Language = 'en'
): Location | null {
  // Return a default location as this is a placeholder
  console.warn('Using placeholder findLocationByCoordinates function');
  return {
    name: language === 'zh' ? '未知位置' : 'Unknown Location',
    latitude,
    longitude
  };
}
