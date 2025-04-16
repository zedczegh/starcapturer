
import { isWaterLocation } from './waterLocationValidator';

/**
 * Check if a location is valid for astronomy viewing
 */
export const isValidAstronomyLocation = (
  latitude: number, 
  longitude: number,
  locationName?: string
): boolean => {
  // Check for valid coordinate ranges
  if (!isFinite(latitude) || !isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return false;
  }
  
  // Use a high confidence threshold for water detection to avoid incorrectly filtering locations
  if (isWaterLocation(latitude, longitude, false)) {
    return false;
  }
  
  // Only filter by name if the name is provided and substantial
  if (locationName && locationName.length > 3) {
    const lowerName = locationName.toLowerCase();
    const commonWaterTerms = ['ocean', 'sea', 'bay', 'gulf', 'lake'];
    
    // Check only for definite water terms in name
    for (const term of commonWaterTerms) {
      // Match only when it's definitely the main feature (with word boundaries)
      if (new RegExp(`\\b${term}\\b`, 'i').test(lowerName)) return false;
    }
  }
  
  return true;
};
