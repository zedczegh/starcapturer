
import { useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Optimized hook to separate certified and calculated recommendation locations
 * Uses memoization for better performance
 * Updates to better identify certified locations based on IDA criteria
 */
export function useCertifiedLocations(locations: SharedAstroSpot[]) {
  // Use memoization to avoid unnecessary recalculations when locations array reference doesn't change
  const certifiedLocations = useMemo(() => 
    locations.filter(location => {
      // Check for explicit Dark Sky Reserve flag
      if (location.isDarkSkyReserve === true) {
        return true;
      }
      
      // Check for certifications based on IDA naming conventions
      if (location.certification !== undefined && location.certification !== '') {
        const cert = location.certification.toLowerCase();
        return (
          cert.includes('dark sky') || 
          cert.includes('sanctuary') || 
          cert.includes('reserve') || 
          cert.includes('park') ||
          cert.includes('community')
        );
      }
      
      return false;
    }),
    [locations]
  );
  
  const calculatedLocations = useMemo(() => 
    locations.filter(location => 
      // All locations that are not certified
      !(location.isDarkSkyReserve === true || 
        (location.certification !== undefined && location.certification !== ''))
    ),
    [locations]
  );
  
  const hasCertifiedLocations = useMemo(() => certifiedLocations.length > 0, [certifiedLocations]);
  const hasCalculatedLocations = useMemo(() => calculatedLocations.length > 0, [calculatedLocations]);
  
  // Calculate total count for each type
  const certifiedCount = useMemo(() => certifiedLocations.length, [certifiedLocations]);
  const calculatedCount = useMemo(() => calculatedLocations.length, [calculatedLocations]);
  
  return {
    certifiedLocations,
    calculatedLocations,
    hasCertifiedLocations,
    hasCalculatedLocations,
    certifiedCount,
    calculatedCount
  };
}
