
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

export const useLocationSorting = () => {
  // Sort locations by quality factors (certified status, SIQS score, distance)
  const sortLocationsByQuality = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    return [...locations].sort((a, b) => {
      // First prioritize certified locations
      const aCertified = a.isDarkSkyReserve || a.certification;
      const bCertified = b.isDarkSkyReserve || b.certification;
      
      if (aCertified && !bCertified) return -1;
      if (!aCertified && bCertified) return 1;
      
      // Then sort by SIQS score (higher is better)
      if (a.siqs !== undefined && b.siqs !== undefined) {
        if (a.siqs > b.siqs) return -1;
        if (a.siqs < b.siqs) return 1;
      }
      
      // Finally sort by distance (if available)
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      
      return 0;
    });
  }, []);

  return { sortLocationsByQuality };
};
