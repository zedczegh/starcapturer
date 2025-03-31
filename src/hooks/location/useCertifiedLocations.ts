
import { useState, useEffect, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to separate certified and calculated recommendation locations
 */
export function useCertifiedLocations(locations: SharedAstroSpot[]) {
  const [certifiedLocations, setCertifiedLocations] = useState<SharedAstroSpot[]>([]);
  const [calculatedLocations, setCalculatedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Whenever the locations array changes, separate into certified and calculated
  useEffect(() => {
    const certified = locations.filter(location => 
      location.isDarkSkyReserve === true || 
      location.certification !== undefined
    );
    
    const calculated = locations.filter(location => 
      !location.isDarkSkyReserve && 
      location.certification === undefined
    );
    
    setCertifiedLocations(certified);
    setCalculatedLocations(calculated);
  }, [locations]);
  
  return {
    certifiedLocations,
    calculatedLocations,
    hasCertifiedLocations: certifiedLocations.length > 0,
    hasCalculatedLocations: calculatedLocations.length > 0
  };
}
