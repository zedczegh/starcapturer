
import { isWaterLocation as checkWaterLocation } from './locationWaterCheck';

/**
 * Basic validation helpers
 */

/**
 * Check if a latitude is valid
 * @param lat The latitude to check
 * @returns True if valid
 */
export const isValidLatitude = (lat: number): boolean => {
  return lat >= -90 && lat <= 90;
};

/**
 * Check if a longitude is valid
 * @param lng The longitude to check
 * @returns True if valid
 */
export const isValidLongitude = (lng: number): boolean => {
  return lng >= -180 && lng <= 180;
};

/**
 * Check if coordinates are valid
 * @param lat The latitude to check
 * @param lng The longitude to check
 * @returns True if valid
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return isValidLatitude(lat) && isValidLongitude(lng);
};

/**
 * Check if a location is in water
 * This function wraps the async water check to provide a unified API
 * @param lat The latitude to check
 * @param lng The longitude to check
 * @param isCertified Whether the location is certified (optional)
 * @returns True if in water, false otherwise
 */
export const isWaterLocation = (lat: number, lng: number, isCertified: boolean = false): boolean => {
  // Critical: If it's a certified location, NEVER consider it a water location
  if (isCertified) return false;
  
  // Use simple version for synchronous operations
  return isWaterLocationSync(lat, lng);
};

/**
 * Check if a location is in water (synchronous version)
 * This is a wrapper around the water check to make it sync
 * @param lat The latitude to check
 * @param lng The longitude to check
 * @returns True if water, false otherwise
 */
export const isWaterLocationSync = (lat: number, lng: number): boolean => {
  // Use simple version as fallback for sync operations
  return isWaterLocationSimple(lat, lng);
};

/**
 * A simpler implementation that doesn't rely on external APIs
 * @param latitude The latitude to check
 * @param longitude The longitude to check
 * @returns True if likely water, false otherwise
 */
const isWaterLocationSimple = (latitude: number, longitude: number): boolean => {
  // Simply check if the location is close to known water coordinates
  // Pacific Ocean
  if (latitude > 20 && latitude < 45 && longitude > -150 && longitude < -115) {
    return true;
  }
  // Atlantic Ocean
  if (latitude > 20 && latitude < 45 && longitude > -80 && longitude < -50) {
    return true;
  }
  
  // Default return
  return false;
};

/**
 * Check if a location is valid for astronomy viewing
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param name Optional location name for additional validation
 * @returns Boolean indicating if location is valid
 */
export const isValidAstronomyLocation = (
  latitude: number,
  longitude: number,
  name?: string
): boolean => {
  // Skip validation for locations without coordinates
  if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
    return false;
  }
  
  // Filter out obvious water names
  if (name) {
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes('sea') || 
      lowerName.includes('ocean') || 
      lowerName.includes('bay') ||
      lowerName.includes('lake') ||
      lowerName.includes('lagoon') ||
      lowerName.includes('gulf') ||
      lowerName.includes('strait')
    ) {
      return false;
    }
  }
  
  return true;
};
