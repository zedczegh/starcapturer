
import { getBortleScaleForLocation } from '@/utils/bortleScaleUtils';

/**
 * Get the Bortle Scale value for a location
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @returns Bortle scale value (1-9)
 */
export function getBortleScaleFromCoordinates(latitude: number, longitude: number): number {
  // Use the utility function to get the bortle scale
  return getBortleScaleForLocation(latitude, longitude);
}

/**
 * Format Bortle Scale description
 * @param bortleValue The Bortle Scale value (1-9)
 * @returns Description of the Bortle Scale level
 */
export function getBortleScaleDescription(bortleValue: number): string {
  const descriptions = [
    "Excellent dark sky", // 1
    "Typical truly dark sky", // 2
    "Rural sky", // 3
    "Rural/suburban transition", // 4
    "Suburban sky", // 5
    "Bright suburban sky", // 6
    "Suburban/urban transition", // 7
    "City sky", // 8
    "Inner city sky" // 9
  ];
  
  // Ensure valid range and return description
  const index = Math.max(0, Math.min(8, Math.round(bortleValue) - 1));
  return descriptions[index];
}
