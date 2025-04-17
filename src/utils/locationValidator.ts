
/**
 * Validation utilities for astronomy locations
 */

/**
 * Check if location has valid coordinates
 */
export function isValidCoordinates(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  
  // Check if latitude is between -90 and 90 degrees
  const validLat = lat >= -90 && lat <= 90;
  
  // Check if longitude is between -180 and 180 degrees
  const validLng = lng >= -180 && lng <= 180;
  
  return validLat && validLng;
}

/**
 * Check if a location has all required fields for astronomy calculations
 */
export function isValidAstronomyLocation(location: any): boolean {
  // Basic validation - must have coordinates
  if (!location) return false;
  
  // Check if has latitude and longitude and they are valid
  const hasValidCoords = isValidCoordinates(location.latitude, location.longitude);
  
  // Optional fields can enhance the location but aren't strictly required
  return hasValidCoords;
}

/**
 * Validate and sanitize a location object
 */
export function validateLocation(location: any) {
  if (!location) return null;
  
  // Ensure valid coordinates
  if (!isValidCoordinates(location.latitude, location.longitude)) {
    return null;
  }
  
  // Ensure location has an ID
  const id = location.id || `loc-${location.latitude}-${location.longitude}`;
  
  // Ensure other basic properties
  return {
    id,
    name: location.name || 'Unknown Location',
    latitude: location.latitude,
    longitude: location.longitude,
    bortleScale: location.bortleScale || null,
    timestamp: location.timestamp || new Date().toISOString(),
    ...location
  };
}
