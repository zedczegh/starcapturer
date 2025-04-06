
/**
 * Utilities for handling and validating coordinates
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  days?: number;
}

// Validates and corrects coordinates to ensure they're within valid ranges
export function validateCoordinates(coordinates: Coordinates): Coordinates {
  const { latitude, longitude, days } = coordinates;
  
  const validLatitude = Math.max(-90, Math.min(90, latitude));
  const validLongitude = normalizeLongitude(longitude);
  
  return {
    latitude: validLatitude,
    longitude: validLongitude,
    days
  };
}

// Normalizes longitude to the range [-180, 180]
export function normalizeLongitude(longitude: number): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

/**
 * Calculate distance between two points in km using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;  // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;  // Distance in km
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Normalize coordinates to ensure they're within valid ranges
 * This handles edge cases and ensures consistent coordinate format
 */
export function normalizeCoordinates(coords: { latitude: number; longitude: number }): { latitude: number; longitude: number } {
  return {
    latitude: Math.max(-90, Math.min(90, coords.latitude)),
    longitude: normalizeLongitude(coords.longitude)
  };
}
