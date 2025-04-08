/**
 * Utilities for validating location coordinates
 */

// Global land/water data could be implemented fully in a real app
const waterCoordinates = new Set([
  // Pacific Ocean samples
  '20.0,-160.0', '0.0,-140.0', '-20.0,-120.0',
  // Atlantic Ocean samples
  '30.0,-50.0', '0.0,-30.0', '-30.0,-20.0',
  // Indian Ocean samples
  '-10.0,70.0', '-20.0,80.0', '-30.0,90.0',
  // Mediterranean Sea samples
  '35.0,18.0', '37.0,20.0', '38.0,16.0',
  // Great Lakes samples
  '43.0,-87.0', '42.5,-82.0', '47.0,-87.5'
]);

/**
 * Check if coordinates correspond to a water location
 * @param latitude Latitude
 * @param longitude Longitude
 * @param useCache Whether to use cached results (default: true)
 * @returns boolean indicating if location is water
 */
export function isWaterLocation(
  latitude: number,
  longitude: number,
  useCache: boolean = true
): boolean {
  const roundedLat = Math.round(latitude * 10) / 10;
  const roundedLng = Math.round(longitude * 10) / 10;
  const key = `${roundedLat},${roundedLng}`;
  
  // Check our simple water coordinates set
  return waterCoordinates.has(key);
}

/**
 * Check if coordinates are likely a coastal water location
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns boolean indicating if location is likely coastal water
 */
export function isLikelyCoastalWater(
  latitude: number,
  longitude: number
): boolean {
  // This is a placeholder for a more sophisticated implementation
  // For now, we'll just check some known coastal water areas
  
  // Mediterranean coastal waters
  if (latitude > 35 && latitude < 45 &&
      longitude > 5 && longitude < 30) {
    return true;
  }
  
  // US East Coast waters
  if (latitude > 25 && latitude < 45 &&
      longitude > -82 && longitude < -70) {
    return true;
  }
  
  return false;
}

/**
 * Check if a location is valid for astronomy purposes
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns boolean indicating if location is valid for astronomy
 */
export function isValidAstronomyLocation(
  latitude: number,
  longitude: number
): boolean {
  // This is a simplified validation
  // In a real app, this would check more astronomy-specific criteria
  
  // Check if it's not water
  if (isWaterLocation(latitude, longitude)) {
    return false;
  }
  
  // Check if it's not likely coastal water
  if (isLikelyCoastalWater(latitude, longitude)) {
    return false;
  }
  
  // Additional checks could be added here
  return true;
}
