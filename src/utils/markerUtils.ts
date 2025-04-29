
// Fix the incorrect use of isWaterLocation function
// Update line around line 42 to have the right number of parameters

/**
 * Check if a marker represents a water location
 * Should only pass two parameters to isWaterLocation
 */
import { isWaterLocation } from './validation';

export function isMarkerInWater(latitude: number, longitude: number): boolean {
  return isWaterLocation(latitude, longitude);
}

// Add other marker utility functions as needed
