
/**
 * Hook to separate certified dark sky locations from calculated locations
 */

import { useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to categorize locations by certification status
 * Efficiently separates and sorts locations based on certification and distance
 * @param locations All locations to process
 * @param searchRadius The current search radius
 * @returns Object containing separated location arrays and counts
 */
export function useCertifiedLocations(
  locations: SharedAstroSpot[],
  searchRadius: number
) {
  return useMemo(() => {
    if (!locations || locations.length === 0) {
      return {
        certifiedLocations: [],
        calculatedLocations: [],
        certifiedCount: 0,
        calculatedCount: 0
      };
    }
    
    // Filter valid locations (with SIQS > 0)
    const validLocations = locations.filter(loc => 
      loc.siqs !== undefined && loc.siqs > 0
    );
    
    // Separate certified from non-certified
    const certified: SharedAstroSpot[] = [];
    const calculated: SharedAstroSpot[] = [];
    
    for (const location of validLocations) {
      if (location.certification || location.isDarkSkyReserve) {
        certified.push(location);
      } else {
        calculated.push(location);
      }
    }
    
    // Sort each group by distance (closest first)
    certified.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    calculated.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    
    return {
      certifiedLocations: certified,
      calculatedLocations: calculated,
      certifiedCount: certified.length,
      calculatedCount: calculated.length
    };
  }, [locations, searchRadius]);
}
