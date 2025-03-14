
import { Location } from './types';
import { majorChineseCities } from './data/majorCities';
import { specialChineseDistricts } from './data/specialDistricts';
import { suburbanChineseDistricts } from './data/suburbanDistricts';
import { westernChineseCities } from './data/westernCities';
import { northeasternChineseCities } from './data/northeasternCities';
import { centralChineseCities } from './data/centralChineseCities';
import { northwesternChineseCities } from './data/northwesternCities';

/**
 * Combined database of all Chinese city alternatives
 */
export const chineseCityAlternatives = {
  ...majorChineseCities,
  ...specialChineseDistricts,
  ...suburbanChineseDistricts,
  ...westernChineseCities,
  ...northeasternChineseCities,
  ...centralChineseCities,
  ...northwesternChineseCities
};

/**
 * Check alternative spellings for Chinese locations
 */
export function checkAlternativeSpellings(query: string): Location[] {
  const results: Location[] = [];
  const queryLower = query.toLowerCase().trim();

  // Try to match against our alternative spellings database
  for (const [key, city] of Object.entries(chineseCityAlternatives)) {
    // Check for exact matches first (higher priority)
    const exactMatch = 
      city.chinese === queryLower || 
      city.alternatives.includes(queryLower) ||
      key === queryLower;
      
    // Check for partial matches (lower priority)
    const partialMatch = 
      !exactMatch && (
        city.chinese.includes(queryLower) || 
        queryLower.includes(city.chinese) ||
        city.alternatives.some(alt => alt.includes(queryLower) || queryLower.includes(alt)) ||
        key.includes(queryLower) ||
        queryLower.includes(key)
      );
      
    if (exactMatch || partialMatch) {
      results.push({
        name: city.name,
        latitude: city.coordinates[0],
        longitude: city.coordinates[1],
        placeDetails: city.placeDetails
      });
      
      // For exact matches, also return the Chinese version
      if (exactMatch) {
        results.push({
          name: city.chinese,
          latitude: city.coordinates[0],
          longitude: city.coordinates[1],
          placeDetails: city.placeDetails
        });
      }
    }
  }
  
  // Sort exact matches before partial matches
  return results;
}
