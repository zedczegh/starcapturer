
/**
 * Service for managing cached location data
 */

// Cache keys for locations
const CALCULATED_LOCATIONS_CACHE = 'calculatedLocationsCache';
const CERTIFIED_LOCATIONS_CACHE = 'certifiedLocationsCache';
const LOCATION_TIMESTAMPS_CACHE = 'locationTimestampsCache';

/**
 * Clear all cached location data
 */
export function clearLocationCache(): void {
  try {
    localStorage.removeItem(CALCULATED_LOCATIONS_CACHE);
    localStorage.removeItem(CERTIFIED_LOCATIONS_CACHE);
    localStorage.removeItem(LOCATION_TIMESTAMPS_CACHE);
    console.log("Location cache cleared successfully");
  } catch (error) {
    console.error("Error clearing location cache:", error);
  }
}

/**
 * Clear cached locations for a specific user location
 */
export function clearLocationCacheForArea(latitude: number, longitude: number, radius: number = 5): void {
  try {
    // For simplicity, just clear all caches if coordinates are provided
    if (latitude && longitude) {
      clearLocationCache();
      console.log(`Cache cleared for area around [${latitude.toFixed(4)}, ${longitude.toFixed(4)}] with radius ${radius}km`);
    }
  } catch (error) {
    console.error("Error clearing location cache for area:", error);
  }
}

/**
 * Mark a specific location as visited/viewed
 */
export function markLocationAsViewed(locationId: string): void {
  try {
    const viewedLocations = getViewedLocations();
    
    if (!viewedLocations.includes(locationId)) {
      viewedLocations.push(locationId);
      localStorage.setItem('viewedLocations', JSON.stringify(viewedLocations));
    }
  } catch (error) {
    console.error("Error marking location as viewed:", error);
  }
}

/**
 * Get list of viewed location IDs
 */
export function getViewedLocations(): string[] {
  try {
    const stored = localStorage.getItem('viewedLocations');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error getting viewed locations:", error);
  }
  return [];
}
