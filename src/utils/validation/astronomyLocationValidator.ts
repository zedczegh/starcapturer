
import { isWaterLocation } from './waterLocationValidator';

/**
 * Check if a location is valid for astronomy viewing
 */
export const isValidAstronomyLocation = (
  latitude: number, 
  longitude: number,
  locationName?: string
): boolean => {
  if (!isFinite(latitude) || !isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return false;
  }
  
  if (isWaterLocation(latitude, longitude, false)) {
    return false;
  }
  
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    const commonWaterTerms = ['ocean', 'sea', 'bay', 'gulf', 'lake'];
    
    for (const term of commonWaterTerms) {
      if (lowerName.includes(term)) return false;
    }
    
    const otherWaterTerms = [
      'strait', 'channel', 'sound', 'harbor', 'harbour', 'port', 
      'pier', 'marina', 'lagoon', 'reservoir', 'fjord', 
      'canal', 'pond', 'basin', 'cove', 'inlet', 'beach'
    ];
    
    for (const term of otherWaterTerms) {
      if (lowerName.includes(term)) return false;
    }
  }
  
  return true;
};
