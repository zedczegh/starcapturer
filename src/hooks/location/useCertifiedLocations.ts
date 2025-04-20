
import { useMemo, useEffect, useState } from 'react';
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
  
  // Use effect to process locations whenever they change
  useEffect(() => {
    if (!locations || locations.length === 0) {
      // Try to load from cache first before setting empty arrays
      try {
        const cachedCertifiedLocations = localStorage.getItem('cachedCertifiedLocations');
        const sessionCertifiedLocations = sessionStorage.getItem('persistent_certified_locations');
        
        // Choose the source with more locations
        let certifiedSource = null;
        let certifiedCount = 0;
        
        if (cachedCertifiedLocations) {
          try {
            const parsed = JSON.parse(cachedCertifiedLocations);
            if (Array.isArray(parsed) && parsed.length > certifiedCount) {
              certifiedSource = parsed;
              certifiedCount = parsed.length;
            }
          } catch (e) {
            console.error('Error parsing cached certified locations:', e);
          }
        }
        
        if (sessionCertifiedLocations) {
          try {
            const parsed = JSON.parse(sessionCertifiedLocations);
            if (Array.isArray(parsed) && parsed.length > certifiedCount) {
              certifiedSource = parsed;
              certifiedCount = parsed.length;
            }
          } catch (e) {
            console.error('Error parsing session certified locations:', e);
          }
        }
        
        if (certifiedSource && certifiedSource.length > 0) {
          console.log(`Using ${certifiedSource.length} cached certified locations`);
          setProcessedLocations({ 
            certified: certifiedSource,
            calculated: [] 
          });
          return;
        }
      } catch (e) {
        console.error('Error loading cached certified locations:', e);
      }
      
      setProcessedLocations({ certified: [], calculated: [] });
      return;
    }
    
    console.log(`Processing ${locations.length} locations for certified/calculated separation`);
    
    // Use a map to ensure we don't have duplicates by coordinates
    const certifiedMap = new Map<string, SharedAstroSpot>();
    const calculatedMap = new Map<string, SharedAstroSpot>();
    
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
        if (!certifiedMap.has(key)) {
          certifiedMap.set(key, location);
        }
      } else {
        if (!calculatedMap.has(key)) {
          calculatedMap.set(key, location);
        }
      }
    });
    
    // Try to load additional certified locations from cache
    try {
      const cachedCertifiedLocations = localStorage.getItem('cachedCertifiedLocations');
      if (cachedCertifiedLocations) {
        const parsed = JSON.parse(cachedCertifiedLocations);
        if (Array.isArray(parsed)) {
          console.log(`Found ${parsed.length} cached certified locations`);
          parsed.forEach(location => {
            if (!location.latitude || !location.longitude) return;
            
            const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
            if (!certifiedMap.has(key)) {
              certifiedMap.set(key, location);
            }
          });
        }
      }
      
      // Also try session storage
      const sessionCertifiedLocations = sessionStorage.getItem('persistent_certified_locations');
      if (sessionCertifiedLocations) {
        const parsed = JSON.parse(sessionCertifiedLocations);
        if (Array.isArray(parsed)) {
          console.log(`Found ${parsed.length} session certified locations`);
          parsed.forEach(location => {
            if (!location.latitude || !location.longitude) return;
            
            const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
            if (!certifiedMap.has(key)) {
              certifiedMap.set(key, location);
            }
          });
        }
      }
    } catch (e) {
      console.error('Error loading cached certified locations:', e);
    }
    
    // Convert maps back to arrays
    const certified = Array.from(certifiedMap.values());
    const calculated = Array.from(calculatedMap.values());
    
    console.log(`Found ${certified.length} certified and ${calculated.length} calculated locations`);
    
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
    
    // Store the certified locations in localStorage for future use
    try {
      localStorage.setItem('cachedCertifiedLocations', JSON.stringify(sortedCertified));
      console.log(`Cached ${sortedCertified.length} certified locations in localStorage`);
    } catch (e) {
      console.error('Error caching certified locations:', e);
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
