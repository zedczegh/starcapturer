
import { useMemo, useEffect, useState, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';

/**
 * Hook to separate certified and calculated recommendation locations
 * Uses memoization and refs for better performance
 */
export function useCertifiedLocations(locations: SharedAstroSpot[]) {
  // Use refs to prevent unnecessary processing
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  const previousHashRef = useRef<string>('');
  
  const [processedLocations, setProcessedLocations] = useState<{
    certified: SharedAstroSpot[],
    calculated: SharedAstroSpot[]
  }>({ certified: [], calculated: [] });
  
  // Create a hash of the locations array to determine if we need to process
  const locationsHash = useMemo(() => {
    if (!locations || locations.length === 0) return '';
    
    // Use only necessary properties for hashing to improve performance
    return locations.map(loc => 
      `${loc.id || ''}:${loc.latitude?.toFixed(4) || ''},${loc.longitude?.toFixed(4) || ''}`
    ).sort().join('|');
  }, [locations]);
  
  // Only process locations when they actually change
  useEffect(() => {
    // Skip processing if hash hasn't changed
    if (locationsHash === previousHashRef.current) {
      return;
    }
    
    if (!locations || locations.length === 0) {
      setProcessedLocations({ certified: [], calculated: [] });
      previousHashRef.current = locationsHash;
      return;
    }
    
    console.log(`Processing ${locations.length} locations for certified/calculated separation`);
    previousHashRef.current = locationsHash;
    
    // Use a map to ensure we don't have duplicates by coordinates
    const certifiedMap = new Map<string, SharedAstroSpot>();
    const calculatedMap = new Map<string, SharedAstroSpot>();
    
    // Process each location - use a batched approach to prevent UI freezing
    const batchSize = 50;
    const totalLocations = locations.length;
    let processedCount = 0;
    
    function processBatch(startIndex: number) {
      const endIndex = Math.min(startIndex + batchSize, totalLocations);
      
      for (let i = startIndex; i < endIndex; i++) {
        const location = locations[i];
        if (!location.latitude || !location.longitude) continue;
        
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
      }
      
      processedCount = endIndex;
      
      // If there are more locations to process, schedule next batch
      if (processedCount < totalLocations) {
        setTimeout(() => processBatch(processedCount), 0);
      } else {
        // Done processing, update state with final results
        finishProcessing();
      }
    }
    
    function finishProcessing() {
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
      
      // Update previous locations for reference
      previousLocationsRef.current = [...locations];
    }
    
    // Start processing the first batch
    processBatch(0);
  }, [locations, locationsHash]);
  
  // Try to load locations from cache if we don't have any
  useEffect(() => {
    if ((processedLocations.certified.length === 0 || processedLocations.calculated.length === 0) && locations.length === 0) {
      try {
        // Check local storage
        const cachedCertifiedLocations = localStorage.getItem('cachedCertifiedLocations');
        
        if (cachedCertifiedLocations) {
          const parsedCertified = JSON.parse(cachedCertifiedLocations);
          if (Array.isArray(parsedCertified) && parsedCertified.length > 0) {
            console.log(`Using ${parsedCertified.length} cached certified locations from localStorage`);
            setProcessedLocations(prev => ({
              ...prev,
              certified: parsedCertified
            }));
          }
        }
      } catch (e) {
        console.error("Error loading certified locations from cache:", e);
      }
    }
  }, [locations, processedLocations]);
  
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
