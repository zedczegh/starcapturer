import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Sort locations by quality factors (certified status, SIQS score, distance)
 */
export const sortLocationsByQuality = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then by SIQS score (higher is better)
    if (a.siqs !== b.siqs) {
      return (b.siqs || 0) - (a.siqs || 0); 
    }
    
    // Then by distance (closer is better)
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
};

/**
 * Filter locations by minimum quality score
 */
export const filterLocationsByQuality = (
  locations: SharedAstroSpot[], 
  minQuality: number
): SharedAstroSpot[] => {
  return locations.filter(location => {
    // Always keep certified locations regardless of quality
    if (location.isDarkSkyReserve || location.certification) {
      return true;
    }
    
    // Filter regular locations by SIQS score
    return (location.siqs || 0) >= minQuality;
  });
};
