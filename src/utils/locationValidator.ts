
import { isWaterLocation } from './locationWaterCheck';

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  
  return true;
}

/**
 * Check if a location is suitable for astrophotography
 */
export function isSuitableLocation(latitude: number, longitude: number): boolean {
  // Validate coordinates first
  if (!isValidCoordinates(latitude, longitude)) return false;
  
  // Check if location is on water
  if (isWaterLocation(latitude, longitude)) return false;
  
  return true;
}

/**
 * Check if a location is on water (re-export from locationWaterCheck)
 */
export { isWaterLocation } from './locationWaterCheck';
