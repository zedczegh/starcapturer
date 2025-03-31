
import { useMemo, useEffect, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to separate certified and calculated recommendation locations
 * Uses memoization for better performance
 * Enhanced to correctly identify certified locations from Dark Sky International
 * Now with proper updates when the radius changes
 */
export function useCertifiedLocations(locations: SharedAstroSpot[], searchRadius?: number) {
  const [lastProcessedLength, setLastProcessedLength] = useState(0);
  const [lastProcessedRadius, setLastProcessedRadius] = useState(0);
  const [processedLocations, setProcessedLocations] = useState<{
    certified: SharedAstroSpot[],
    calculated: SharedAstroSpot[]
  }>({ certified: [], calculated: [] });
  
  // Use effect to update processed locations when locations or radius changes
  useEffect(() => {
    if (locations.length === lastProcessedLength && searchRadius === lastProcessedRadius) {
      return; // Skip processing if nothing changed
    }
    
    // Identify certified locations
    const certified = locations.filter(location => {
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
    });
    
    // All locations that are not certified are calculated
    const calculated = locations.filter(location => 
      !(location.isDarkSkyReserve === true || 
        (location.certification && location.certification !== ''))
    );
    
    setProcessedLocations({
      certified,
      calculated
    });
    setLastProcessedLength(locations.length);
    setLastProcessedRadius(searchRadius || 0);
    
  }, [locations, searchRadius, lastProcessedLength, lastProcessedRadius]);
  
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
