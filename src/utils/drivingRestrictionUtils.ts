
import { DrivingRestriction, restrictedDrivingCities } from '@/data/regions/restrictedDrivingCities';
import { calculateDistance } from '@/data/locationDatabase';

/**
 * Check if a given location is in a city with driving restrictions
 * @param latitude Latitude of the location to check
 * @param longitude Longitude of the location to check
 * @returns Restriction information if in a restricted city, null otherwise
 */
export function checkDrivingRestrictions(latitude: number, longitude: number): DrivingRestriction | null {
  // Search radius in km to consider a location within a city
  const CITY_SEARCH_RADIUS = 20; 
  
  // Find any cities with restrictions near this location
  for (const city of restrictedDrivingCities) {
    const distance = calculateDistance(
      latitude, 
      longitude,
      city.coordinates[0],
      city.coordinates[1]
    );
    
    // If location is within the search radius of a restricted city
    if (distance <= CITY_SEARCH_RADIUS) {
      return city;
    }
  }
  
  return null;
}

/**
 * Get restriction description based on the current day
 * @param city The restricted driving city
 * @returns Formatted restriction description
 */
export function getTodayRestrictionDetails(city: DrivingRestriction): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Most restrictions don't apply on weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return `${city.city} typically doesn't have driving restrictions on weekends`;
  }
  
  return city.restrictionDetails || 
    `${city.city} has ${city.restrictionType} restrictions today`;
}
