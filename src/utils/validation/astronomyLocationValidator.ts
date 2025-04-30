
import { isWaterLocation, isLikelyCoastalWater } from './waterLocationValidator';

/**
 * Check if a location is valid for astronomy viewing
 * Combines multiple checks to filter out unusable spots with better performance
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
  // Must have valid coordinates - fast check first
  if (!isFinite(latitude) || !isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return false;
  }
  
  // Check if it's a water location - passing false to ensure certified locations aren't filtered
  if (isWaterLocation(latitude, longitude, false)) {
    return false;
  }
  
  // Check if it's likely coastal water
  if (isLikelyCoastalWater(latitude, longitude)) {
    return false;
  }
  
  // If location has a name that suggests water (optional check)
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    // Use faster includes method and early returns
    const commonWaterTerms = ['ocean', 'sea', 'bay', 'gulf', 'lake'];
    
    for (const term of commonWaterTerms) {
      if (lowerName.includes(term)) return false;
    }
    
    // Only check less common terms if we pass the common ones
    const otherWaterTerms = [
      'strait', 'channel', 'sound', 'harbor', 'harbour', 'port', 
      'pier', 'marina', 'lagoon', 'reservoir', 'fjord', 
      'canal', 'pond', 'basin', 'cove', 'inlet', 'beach'
    ];
    
    for (const term of otherWaterTerms) {
      if (lowerName.includes(term)) return false;
    }
  }
  
  // All checks passed
  return true;
};
