
/**
 * Utility functions for coordinate operations
 */

/**
 * Normalize coordinates to ensure they're within valid ranges
 * @param latitude Latitude value to normalize 
 * @param longitude Longitude value to normalize
 * @returns Array with normalized coordinates [lat, lng]
 */
export function normalizeCoordinates(latitude: number, longitude: number): [number, number] {
  // Ensure latitude is between -90 and 90
  const normalizedLat = Math.max(-90, Math.min(90, latitude));
  
  // Ensure longitude is between -180 and 180
  let normalizedLng = longitude;
  while (normalizedLng > 180) normalizedLng -= 360;
  while (normalizedLng < -180) normalizedLng += 360;
  
  return [normalizedLat, normalizedLng];
}

/**
 * Check if coordinates are in valid ranges
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @returns Boolean indicating if coordinates are valid
 */
export function areValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    isFinite(latitude) &&
    isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
