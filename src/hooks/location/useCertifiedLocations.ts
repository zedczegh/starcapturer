
import { useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Optimized hook to separate certified and calculated recommendation locations
 * Uses memoization for better performance
 */
export function useCertifiedLocations(locations: SharedAstroSpot[]) {
  // Use memoization to avoid unnecessary recalculations when locations array reference doesn't change
  const certifiedLocations = useMemo(() => 
    locations.filter(location => 
      location.isDarkSkyReserve === true || 
      location.certification !== undefined
    ),
    [locations]
  );
  
  const calculatedLocations = useMemo(() => 
    locations.filter(location => 
      !location.isDarkSkyReserve && 
      location.certification === undefined
    ),
    [locations]
  );
  
  const hasCertifiedLocations = useMemo(() => certifiedLocations.length > 0, [certifiedLocations]);
  const hasCalculatedLocations = useMemo(() => calculatedLocations.length > 0, [calculatedLocations]);
  
  return {
    certifiedLocations,
    calculatedLocations,
    hasCertifiedLocations,
    hasCalculatedLocations
  };
}
