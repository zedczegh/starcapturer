
import { useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to separate certified and calculated recommendation locations
 * Uses memoization for better performance
 * Enhanced to correctly identify certified locations from Dark Sky International
 */
export function useCertifiedLocations(locations: SharedAstroSpot[]) {
  // Use memoization to avoid unnecessary recalculations
  const certifiedLocations = useMemo(() => 
    locations.filter(location => {
      // Check for explicit Dark Sky Reserve flag
      if (location.isDarkSkyReserve === true) {
        return true;
      }
      
      // Check for certifications based on official Dark Sky names
      if (location.certification && location.certification !== '') {
        const cert = location.certification.toLowerCase();
        return (
          cert.includes('international dark sky') || 
          cert.includes('dark sky sanctuary') || 
          cert.includes('dark sky reserve') || 
          cert.includes('dark sky park') ||
          cert.includes('dark sky community') ||
          cert.includes('urban night sky place')
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
        (location.certification && location.certification !== ''))
    ),
    [locations]
  );
  
  const hasCertifiedLocations = useMemo(() => certifiedLocations.length > 0, [certifiedLocations]);
  const hasCalculatedLocations = useMemo(() => calculatedLocations.length > 0, [calculatedLocations]);
  
  // Calculate counts for UI display
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
