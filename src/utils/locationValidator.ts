
/**
 * Utility functions for validating locations for astronomy
 */

/**
 * Check if a location is likely in a water area
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns True if location is likely in water
 */
export const isWaterLocation = (latitude: number, longitude: number): boolean => {
  // Simplified implementation - in production this would use proper geo data
  // Currently just a placeholder that returns false
  return false;
};

/**
 * Check if a location is valid for astronomy viewing
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param name Optional location name
 * @returns True if location is valid for astronomy
 */
export const isValidAstronomyLocation = (
  latitude: number, 
  longitude: number,
  name?: string
): boolean => {
  // Don't allow water locations
  if (isWaterLocation(latitude, longitude)) {
    return false;
  }
  
  // Basic validation for latitude/longitude
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }
  
  return true;
};
