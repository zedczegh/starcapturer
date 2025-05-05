
/**
 * Utilities for handling and validating coordinates
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  days?: number;
}

/**
 * Validates and corrects coordinates to ensure they're within valid ranges
 * Handles various edge cases like NaN, undefined, etc.
 */
export function validateCoordinates(coordinates: Coordinates): Coordinates {
  if (!coordinates) {
    throw new Error("No coordinates provided");
  }
  
  let { latitude, longitude, days } = coordinates;
  
  // Handle invalid numeric values
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    console.warn("Invalid latitude provided:", latitude);
    latitude = 0;
  }
  
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    console.warn("Invalid longitude provided:", longitude);
    longitude = 0;
  }
  
  const validLatitude = Math.max(-90, Math.min(90, latitude));
  const validLongitude = normalizeLongitude(longitude);
  
  // If coordinates were corrected, log a warning
  if (validLatitude !== latitude || validLongitude !== longitude) {
    console.warn(
      `Coordinates were corrected from [${latitude}, ${longitude}] to [${validLatitude}, ${validLongitude}]`
    );
  }
  
  return {
    latitude: validLatitude,
    longitude: validLongitude,
    days
  };
}

/**
 * Normalizes longitude to the range [-180, 180]
 * Handles special cases and invalid inputs
 */
export function normalizeLongitude(longitude: number): number {
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    return 0;
  }
  
  // Handle special case of exactly -180 or 180
  if (longitude === -180 || longitude === 180) {
    return longitude;
  }
  
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

/**
 * Calculate distance between two points in km using Haversine formula
 * With additional validation for edge cases
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Validate inputs
  if (
    typeof lat1 !== 'number' || 
    typeof lon1 !== 'number' || 
    typeof lat2 !== 'number' || 
    typeof lon2 !== 'number' ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    console.warn("Invalid coordinates in calculateDistance:", {lat1, lon1, lat2, lon2});
    return 0;
  }
  
  // Normalize inputs
  lat1 = Math.max(-90, Math.min(90, lat1));
  lon1 = normalizeLongitude(lon1);
  lat2 = Math.max(-90, Math.min(90, lat2));
  lon2 = normalizeLongitude(lon2);
  
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
  if (!coords) {
    console.warn("No coordinates provided to normalizeCoordinates");
    return { latitude: 0, longitude: 0 };
  }
  
  // Handle invalid coordinates
  if (typeof coords.latitude !== 'number' || isNaN(coords.latitude)) {
    console.warn("Invalid latitude in normalizeCoordinates:", coords.latitude);
    coords.latitude = 0;
  }
  
  if (typeof coords.longitude !== 'number' || isNaN(coords.longitude)) {
    console.warn("Invalid longitude in normalizeCoordinates:", coords.longitude);
    coords.longitude = 0;
  }
  
  return {
    latitude: Math.max(-90, Math.min(90, coords.latitude)),
    longitude: normalizeLongitude(coords.longitude)
  };
}

/**
 * Checks if coordinates are valid
 */
export function areValidCoordinates(latitude: any, longitude: any): boolean {
  return (
    typeof latitude === 'number' && 
    typeof longitude === 'number' && 
    !isNaN(latitude) && 
    !isNaN(longitude) && 
    latitude >= -90 && 
    latitude <= 90 && 
    longitude >= -180 && 
    longitude <= 180
  );
}

/**
 * Safely extracts coordinates from an object
 * Returns null if coordinates are invalid
 */
export function extractCoordinates(data: any): Coordinates | null {
  if (!data) return null;
  
  const latitude = parseFloat(data.latitude);
  const longitude = parseFloat(data.longitude);
  
  if (areValidCoordinates(latitude, longitude)) {
    return { latitude, longitude };
  }
  
  return null;
}
