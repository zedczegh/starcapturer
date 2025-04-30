
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
