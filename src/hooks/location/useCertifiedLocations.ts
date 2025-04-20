
import { useMemo, useEffect, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { preloadCertifiedLocations, getAllCertifiedLocations } from '@/services/certifiedLocationsService';

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
    // Always try to load certified locations first to ensure we have all of them
    const loadAllCertifiedLocations = async () => {
      try {
        // This will preload ALL certified locations (should be 80+)
        const certifiedLocations = await preloadCertifiedLocations();
        console.log(`Preloaded ${certifiedLocations.length} certified locations`);
        
        // Continue with normal processing
        processAllLocations(locations, certifiedLocations);
      } catch (error) {
        console.error("Error preloading certified locations:", error);
        // Fall back to just using the locations passed in
        processAllLocations(locations, []);
      }
    };
    
    loadAllCertifiedLocations();
  }, [locations]);
  
  // Function to process all locations with certified locations
  const processAllLocations = (
    userLocations: SharedAstroSpot[],
    allCertifiedLocations: SharedAstroSpot[]
  ) => {
    if (!userLocations || userLocations.length === 0) {
      // If no user locations provided, just use the certified locations
      if (allCertifiedLocations.length > 0) {
        console.log(`Using ${allCertifiedLocations.length} preloaded certified locations`);
        setProcessedLocations({ 
          certified: allCertifiedLocations,
          calculated: [] 
        });
      } else {
        // Try to load from cache as a last resort
        try {
          const cachedCertifiedLocations = localStorage.getItem('cachedCertifiedLocations');
          const sessionCertifiedLocations = sessionStorage.getItem('persistent_certified_locations');
          
          // Choose the source with more locations
          let certifiedSource = [];
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
      }
      return;
    }
    
    console.log(`Processing ${userLocations.length} locations and ${allCertifiedLocations.length} certified locations`);
    
    // Use a map to ensure we don't have duplicates by coordinates
    const certifiedMap = new Map<string, SharedAstroSpot>();
    const calculatedMap = new Map<string, SharedAstroSpot>();
    
    // First add all the preloaded certified locations
    if (allCertifiedLocations && allCertifiedLocations.length > 0) {
      allCertifiedLocations.forEach(location => {
        if (!location.latitude || !location.longitude) return;
        
        const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        if (!certifiedMap.has(key)) {
          certifiedMap.set(key, location);
        }
      });
    }
    
    // Then process each user-provided location
    userLocations.forEach(location => {
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
        certifiedMap.set(key, location);
      } else {
        calculatedMap.set(key, location);
      }
    });
    
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
  };
  
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
