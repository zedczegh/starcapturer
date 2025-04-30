
/**
 * Water location validator for checking if a point is in water
 * This is a simplified version of the water location check
 */

/**
 * Check if a location is in water
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Boolean indicating if location is in water
 */
export const isWaterLocation = (
  latitude: number,
  longitude: number
): boolean => {
  // Check if coordinates are valid
  if (
    !latitude || 
    !longitude || 
    !isFinite(latitude) || 
    !isFinite(longitude) ||
    latitude < -90 || 
    latitude > 90 || 
    longitude < -180 || 
    longitude > 180
  ) {
    return false;
  }

  // Ocean detection (simple version)
  // Pacific Ocean
  if ((latitude > 20 && latitude < 60 && longitude > -180 && longitude < -115) ||
      (latitude > -60 && latitude < 20 && longitude > -180 && longitude < -70)) {
    return true;
  }
  
  // Atlantic Ocean
  if ((latitude > 20 && latitude < 65 && longitude > -80 && longitude < -10) ||
      (latitude > -50 && latitude < 20 && longitude > -60 && longitude < 20)) {
    return true;
  }
  
  // Indian Ocean
  if (latitude > -60 && latitude < 20 && longitude > 40 && longitude < 120) {
    return true;
  }

  return false;
};

/**
 * Check if a location is likely to be coastal water
 * This helps catch areas near coastlines that might be in water
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Boolean indicating if location is likely coastal water
 */
export const isLikelyCoastalWater = (
  latitude: number,
  longitude: number
): boolean => {
  // This is a simplified check for coastal waters
  // In a real implementation, this would use more sophisticated algorithms
  // or external data sources to determine coastal regions
  
  // Example check for some common coastal areas
  // Gulf of Mexico coastal region
  if (latitude > 18 && latitude < 30 && longitude > -98 && longitude < -80) {
    // Check if we're likely in water and not on land
    // This is just a rough approximation
    return true;
  }
  
  // Mediterranean coastal waters
  if (latitude > 30 && latitude < 45 && longitude > 0 && longitude < 30) {
    return true;
  }
  
  // East China Sea coastal waters
  if (latitude > 25 && latitude < 35 && longitude > 120 && longitude < 130) {
    return true;
  }
  
  return false;
};

/**
 * Asynchronous version of isWaterLocation that returns a Promise
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Promise resolving to boolean indicating if location is in water
 */
export const isWaterLocationAsync = async (
  latitude: number,
  longitude: number
): Promise<boolean> => {
  return isWaterLocation(latitude, longitude);
};

export default isWaterLocation;
