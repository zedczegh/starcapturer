
/**
 * Utility functions for validating location data
 */
import { haversineDistance } from './geoUtils';

// Check if coordinates are valid
export function isValidCoordinates(lat: number, lng: number): boolean {
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    return false;
  }
  
  // Latitude must be between -90 and 90
  if (lat < -90 || lat > 90) {
    return false;
  }
  
  // Longitude must be between -180 and 180
  if (lng < -180 || lng > 180) {
    return false;
  }
  
  return true;
}

// Check if a location is in water
export function isWaterLocation(location: any): boolean {
  // If we have explicit water flag, use it
  if (location.isWater === true) {
    return true;
  }
  
  // If we have water percentage, use it
  if (typeof location.waterPercentage === 'number' && location.waterPercentage > 80) {
    return true;
  }
  
  return false;
}

export function isLikelyCoastalWater(latitude: number, longitude: number): boolean {
  // Simplified check - this could be replaced with a more sophisticated algorithm
  // using actual coastline data or a service API
  
  // For now, just check if the coordinates match known ocean areas
  // This is extremely simplified and would need to be replaced with real logic
  
  // Check for major oceans (very rough approximation)
  if (
    // Pacific Ocean (very rough boundaries)
    (longitude > 100 && longitude < -100 && Math.abs(latitude) < 65) ||
    // Atlantic Ocean (very rough boundaries)
    (longitude > -100 && longitude < 20 && Math.abs(latitude) < 65) ||
    // Indian Ocean (very rough boundaries)
    (longitude > 20 && longitude < 100 && latitude < 30 && latitude > -65)
  ) {
    return true;
  }
  
  return false;
}

// Validate location for astronomy usage
export function isValidAstronomyLocation(location: any): boolean {
  // Must have valid coordinates
  if (!location || !isValidCoordinates(location.latitude, location.longitude)) {
    return false;
  }
  
  // Not in water
  if (isWaterLocation(location)) {
    return false;
  }
  
  return true;
}

// Calculate distance between locations
export function calculateDistance(location1: any, location2: any): number {
  if (!location1 || !location2) {
    return Infinity;
  }
  
  if (!isValidCoordinates(location1.latitude, location1.longitude) || 
      !isValidCoordinates(location2.latitude, location2.longitude)) {
    return Infinity;
  }
  
  return haversineDistance(
    location1.latitude,
    location1.longitude,
    location2.latitude,
    location2.longitude
  );
}
