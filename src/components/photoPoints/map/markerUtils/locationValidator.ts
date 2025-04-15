
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation, isValidAstronomyLocation, isLikelyCoastalWater } from '@/utils/locationValidator';

/**
 * Helper function to determine if a location is a water spot
 */
export const isWaterSpot = (location: SharedAstroSpot): boolean => {
  // IMPORTANT: Never filter out certified locations regardless of water detection
  if (location.isDarkSkyReserve || location.certification) {
    return false;
  }
  
  // Only apply water detection to non-certified locations
  if (isWaterLocation(location.latitude, location.longitude, false)) {
    return true;
  }
  
  if (isLikelyCoastalWater(location.latitude, location.longitude)) {
    return true;
  }
  
  if (location.name) {
    const lowerName = location.name.toLowerCase();
    const waterKeywords = [
      'ocean', 'sea', 'bay', 'gulf', 'lake', 'strait', 
      'channel', 'sound', 'harbor', 'harbour', 'port', 
      'pier', 'marina', 'lagoon', 'reservoir', 'fjord', 
      'canal', 'pond', 'basin', 'cove', 'inlet', 'beach'
    ];
    
    for (const keyword of waterKeywords) {
      if (lowerName.includes(keyword)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Determine whether a location should be rendered on the map
 */
export const shouldRenderLocation = (location: SharedAstroSpot, isCertified: boolean, activeView: 'certified' | 'calculated'): boolean => {
  // IMPORTANT: Always show certified locations in all views
  if (isCertified) {
    return true;
  }
  
  // For certified view, ONLY show certified locations
  if (activeView === 'certified') {
    return false;
  }
  
  // For calculated view, filter water spots (but never filter certified locations)
  if (isWaterSpot(location)) {
    return false;
  }
  
  if (!isValidAstronomyLocation(location.latitude, location.longitude, location.name)) {
    return false;
  }
  
  return true;
};
