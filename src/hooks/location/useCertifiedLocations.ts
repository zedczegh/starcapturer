
import { useMemo, useEffect, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to separate certified and calculated recommendation locations
 * Uses memoization for better performance
 */
export function useCertifiedLocations(locations: SharedAstroSpot[], searchRadius?: number) {
  const [processedLocations, setProcessedLocations] = useState<{
    certified: SharedAstroSpot[],
    calculated: SharedAstroSpot[]
  }>({ certified: [], calculated: [] });
  
  // Use effect to process locations whenever they change
  useEffect(() => {
    if (!locations || locations.length === 0) {
      setProcessedLocations({ certified: [], calculated: [] });
      return;
    }
    
    console.log(`Processing ${locations.length} locations for certified/calculated separation`);
    
    // Identify certified locations with improved criteria
    const certified = locations.filter(location => {
      // Check for explicit Dark Sky Reserve flag
      if (location.isDarkSkyReserve === true) {
        return true;
      }
      
      // Check for certifications based on official Dark Sky names or properties
      if (location.certification && location.certification !== '') {
        const cert = location.certification.toLowerCase();
        return (
          cert.includes('international dark sky') || 
          cert.includes('dark sky sanctuary') || 
          cert.includes('dark sky reserve') || 
          cert.includes('dark sky park') ||
          cert.includes('dark sky community') ||
          cert.includes('urban night sky place') ||
          cert.includes('dark sky association') ||
          cert.includes('ida')
        );
      }
      
      // Also check name for potential certified locations that might be missing proper flags
      if (location.name) {
        const name = location.name.toLowerCase();
        return (
          (name.includes('dark sky') || name.includes('dark-sky')) &&
          (name.includes('reserve') || 
           name.includes('sanctuary') || 
           name.includes('park') ||
           name.includes('community') ||
           name.includes('certified'))
        );
      }
      
      return false;
    });
    
    // All locations that are not certified are calculated
    const calculated = locations.filter(location => 
      !certified.some(cert => 
        cert.id === location.id || 
        (cert.latitude === location.latitude && cert.longitude === location.longitude)
      )
    );
    
    console.log(`Found ${certified.length} certified and ${calculated.length} calculated locations`);
    
    // Sort both arrays by distance (if available)
    const sortedCertified = [...certified].sort((a, b) => 
      (a.distance || Infinity) - (b.distance || Infinity)
    );
    
    const sortedCalculated = [...calculated].sort((a, b) => 
      (a.distance || Infinity) - (b.distance || Infinity)
    );
    
    setProcessedLocations({
      certified: sortedCertified,
      calculated: sortedCalculated
    });
  }, [locations]);
  
  // Memoized values derived from processed locations
  const certifiedLocations = useMemo(() => processedLocations.certified, [processedLocations]);
  const calculatedLocations = useMemo(() => processedLocations.calculated, [processedLocations]);
  
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
