
import { useMemo, useEffect, useState, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';

/**
 * Hook to separate certified and calculated recommendation locations
 * Uses memoization for better performance
 */
export function useCertifiedLocations(locations: SharedAstroSpot[]) {
  const [processedLocations, setProcessedLocations] = useState<{
    certified: SharedAstroSpot[],
    calculated: SharedAstroSpot[]
  }>({ certified: [], calculated: [] });
  
  // Use a ref to maintain certified locations even if source array changes
  const certifiedLocationsRef = useRef<SharedAstroSpot[]>([]);
  
  // Use effect to process locations whenever they change
  useEffect(() => {
    // Always check for cached certified locations first if we don't have any
    if ((!locations || locations.length === 0) && certifiedLocationsRef.current.length === 0) {
      try {
        const cachedCertifiedLocations = localStorage.getItem('cachedCertifiedLocations');
        if (cachedCertifiedLocations) {
          const parsed = JSON.parse(cachedCertifiedLocations);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Using ${parsed.length} cached certified locations`);
            certifiedLocationsRef.current = parsed;
            setProcessedLocations(prev => ({
              ...prev,
              certified: parsed
            }));
          }
        }
      } catch (e) {
        console.error("Error loading certified locations from cache:", e);
      }
    }
    
    if (!locations || locations.length === 0) {
      return;
    }
    
    console.log(`Processing ${locations.length} locations for certified/calculated separation`);
    
    // Use a map to ensure we don't have duplicates by coordinates
    const certifiedMap = new Map<string, SharedAstroSpot>();
    const calculatedMap = new Map<string, SharedAstroSpot>();
    
    // First add any existing certified locations to ensure we don't lose them
    if (certifiedLocationsRef.current.length > 0) {
      certifiedLocationsRef.current.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          certifiedMap.set(key, loc);
        }
      });
    }
    
    // Process each location
    locations.forEach(location => {
      if (!location.latitude || !location.longitude) return;
      
      const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
      
      // Determine if location is certified
      const isCertified = 
        location.isDarkSkyReserve === true || 
        (location.certification && location.certification !== '') ||
        (location.name && location.name.toLowerCase().includes('dark sky') && 
         (location.name.toLowerCase().includes('reserve') || 
          location.name.toLowerCase().includes('sanctuary') || 
          location.name.toLowerCase().includes('park')));
      
      if (isCertified) {
        // Always update certified locations to get the freshest data
        certifiedMap.set(key, location);
      } else {
        if (!calculatedMap.has(key)) {
          calculatedMap.set(key, location);
        }
      }
    });
    
    // Convert maps back to arrays
    const certified = Array.from(certifiedMap.values());
    const calculated = Array.from(calculatedMap.values());
    
    console.log(`Found ${certified.length} certified and ${calculated.length} calculated locations`);
    
    // Update our ref to maintain certified locations across renders
    certifiedLocationsRef.current = certified;
    
    // Sort certified locations by name for better discoverability
    const sortedCertified = [...certified].sort((a, b) => {
      // First prioritize by certification type
      const getTypeOrder = (loc: SharedAstroSpot) => {
        const cert = (loc.certification || '').toLowerCase();
        if (loc.isDarkSkyReserve || cert.includes('reserve')) return 1;
        if (cert.includes('park')) return 2;
        if (cert.includes('community')) return 3;
        if (cert.includes('urban')) return 4;
        if (cert.includes('lodging')) return 5;
        return 6;
      };
      
      const typeOrderA = getTypeOrder(a);
      const typeOrderB = getTypeOrder(b);
      
      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB;
      }
      
      // Then sort by name
      return (a.name || '').localeCompare(b.name || '');
    });
    
    // Sort calculated locations by SIQS quality if available
    const sortedCalculated = [...calculated].sort((a, b) => 
      (getSiqsScore(b.siqs) || 0) - (getSiqsScore(a.siqs) || 0)
    );
    
    setProcessedLocations({
      certified: sortedCertified,
      calculated: sortedCalculated
    });
    
    // Cache certified locations for future use
    try {
      if (certified.length > 0) {
        localStorage.setItem('cachedCertifiedLocations', JSON.stringify(certified));
      }
    } catch (e) {
      console.error("Error caching certified locations:", e);
    }
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
