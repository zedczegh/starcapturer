
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';

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
    const aSiqs = getSiqsScore(a.siqs);
    const bSiqs = getSiqsScore(b.siqs);
    
    if (aSiqs !== bSiqs) {
      return bSiqs - aSiqs; 
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
    const locationSiqs = getSiqsScore(location.siqs);
    return locationSiqs >= minQuality;
  });
};
