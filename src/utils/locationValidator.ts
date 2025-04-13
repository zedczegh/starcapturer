
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
 * Check if a location is likely to be coastal water
 * Enhanced detection for coastal areas
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is likely coastal water
 */
export const isLikelyCoastalWater = (
  latitude: number,
  longitude: number
): boolean => {
  // These are simplified heuristics for coastal waters
  // Would be enhanced with actual coastline data in production

  // Coastal waters detection heuristics
  // Known coastal areas with many water locations
  
  // US East Coast
  if (latitude > 25 && latitude < 45 && 
      longitude > -80 && longitude < -70) {
    // Check if very close to exact coastal coordinates
    // This is a simplified version - real implementation would use coastline data
    const knownCoastalPoints = [
      {lat: 40.7, lng: -74.0}, // NYC area
      {lat: 42.3, lng: -71.0}, // Boston area
      {lat: 38.9, lng: -77.0}, // DC area
      {lat: 25.8, lng: -80.2}, // Miami area
    ];
    
    // If very close to known coastal points AND seems to be in water, likely coastal
    for (const point of knownCoastalPoints) {
      const distance = Math.sqrt(
        Math.pow(latitude - point.lat, 2) + 
        Math.pow(longitude - point.lng, 2)
      );
      
      if (distance < 0.5) { // Within ~50km
        return true;
      }
    }
  }
  
  // Add more coastal regions as needed
  
  return false;
};

/**
 * Check if a location is valid for astronomy viewing
 * Combines multiple checks to filter out unusable spots
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param locationName Optional location name for additional checks
 * @returns boolean indicating if location is valid for astronomy
 */
export const isValidAstronomyLocation = (
  latitude: number, 
  longitude: number,
  locationName?: string
): boolean => {
  // Must have valid coordinates
  if (typeof latitude !== 'number' || 
      typeof longitude !== 'number' ||
      !isFinite(latitude) || 
      !isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180) {
    return false;
  }
  
  // Check if it's a water location
  if (isWaterLocation(latitude, longitude)) {
    return false;
  }
  
  // Check if it's likely coastal water
  if (isLikelyCoastalWater(latitude, longitude)) {
    return false;
  }
  
  // If location has a name that suggests water (optional check)
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    if (lowerName.includes('ocean') || 
        lowerName.includes('sea') || 
        lowerName.includes('bay') || 
        lowerName.includes('gulf') ||
        lowerName.includes('lake')) {
      return false;
    }
  }
  
  // All checks passed
  return true;
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
