
/**
 * Coordinate validation and normalization utilities
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  days?: number;
}

/**
 * Validate and normalize coordinates
 */
export function validateCoordinates(coordinates: Coordinates): Coordinates {
  const { latitude, longitude, days } = coordinates;
  
  // Validate latitude (-90 to 90)
  const validLat = Math.max(-90, Math.min(90, latitude));
  
  // Validate longitude (-180 to 180)
  const validLng = normalizeLongitude(longitude);
  
  // Validate days
  const validDays = days && days > 0 ? Math.min(16, days) : 3;
  
  return {
    latitude: validLat,
    longitude: validLng,
    days: validDays
  };
}

/**
 * Normalize longitude to -180 to 180 range
 */
export function normalizeLongitude(longitude: number): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}
