
/**
 * Utility to check if a location is in water
 */

/**
 * Check if a location is in water
 * @param lat Latitude of the location
 * @param lng Longitude of the location
 * @returns Boolean indicating if location is in water
 */
export const isWaterLocation = (lat: number, lng: number): boolean => {
  // Ocean detection (simple version)
  // Pacific Ocean
  if ((lat > 20 && lat < 60 && lng > -180 && lng < -115) ||
      (lat > -60 && lat < 20 && lng > -180 && lng < -70)) {
    return true;
  }
  
  // Atlantic Ocean
  if ((lat > 20 && lat < 65 && lng > -80 && lng < -10) ||
      (lat > -50 && lat < 20 && lng > -60 && lng < 20)) {
    return true;
  }
  
  // Indian Ocean
  if (lat > -60 && lat < 20 && lng > 40 && lng < 120) {
    return true;
  }
  
  // Check for some large lakes and inland seas
  // Caspian Sea
  if (lat > 36 && lat < 47 && lng > 46 && lng < 55) {
    return true;
  }
  // Great Lakes
  if (lat > 41 && lat < 49 && lng > -93 && lng < -76) {
    return true;
  }

  return false;
};

/**
 * Asynchronous version of isWaterLocation that returns a Promise
 * @param lat Latitude of the location
 * @param lng Longitude of the location
 * @returns Promise resolving to boolean indicating if location is in water
 */
export const isWaterLocationAsync = async (
  lat: number,
  lng: number
): Promise<boolean> => {
  return isWaterLocation(lat, lng);
};

export default isWaterLocation;
