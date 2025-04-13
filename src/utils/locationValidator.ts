
/**
 * Location validation utilities
 * IMPORTANT: These functions validate location data to prevent rendering errors.
 * Any changes should be carefully tested against edge cases.
 */
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Check if coordinates represent a water location
 * This is a critical function for filtering out unusable spots
 */
export const isWaterLocation = (
  latitude: number, 
  longitude: number,
  isCertified: boolean = false
): boolean => {
  // If it's a certified location, never consider it a water location
  if (isCertified) return false;
  
  // Basic water detection algorithm (simplified version)
  // Actual implementation would use more sophisticated land/water detection
  
  // Example check for open oceans at certain coordinates
  // Pacific Ocean
  if (latitude > -60 && latitude < 60 && 
      ((longitude > 150 || longitude < -120))) {
    return true;
  }
  
  // Atlantic Ocean
  if (latitude > -50 && latitude < 65 && 
      longitude > -80 && longitude < -10) {
    return true;
  }
  
  // Indian Ocean
  if (latitude > -50 && latitude < 30 && 
      longitude > 30 && longitude < 120) {
    return true;
  }
  
  return false;
};

/**
 * Validate location coordinates are within valid ranges
 * @param location Location to validate
 * @returns boolean indicating if location is valid
 */
export const hasValidCoordinates = (location: SharedAstroSpot): boolean => {
  return Boolean(
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number' &&
    isFinite(location.latitude) &&
    isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  );
};

/**
 * Create a unique ID for a location
 * @param location Location to create ID for
 * @returns string ID
 */
export const getLocationId = (location: SharedAstroSpot): string => {
  return location.id || 
    `location-${location.latitude?.toFixed(6)}-${location.longitude?.toFixed(6)}`;
};

/**
 * Check if a location is a certified dark sky location
 * @param location Location to check
 * @returns boolean indicating if location is certified
 */
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  return location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== '');
};
