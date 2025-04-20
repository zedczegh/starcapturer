
import { useMemo, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { CertificationType } from '@/components/photoPoints/filters/CertificationFilter';

/**
 * Hook to filter certified locations based on certification type
 * @param locations All certified locations
 * @param selectedType Selected certification type filter
 */
export function useCertifiedLocationsFilter(
  locations: SharedAstroSpot[], 
  selectedType: CertificationType
) {
  // Reference to previous locations to prevent re-filtering for same data
  const prevLocationsRef = useRef<SharedAstroSpot[]>([]);
  const prevSelectedTypeRef = useRef<CertificationType>(selectedType);
  const filteredLocationsRef = useRef<SharedAstroSpot[]>([]);
  
  // Filter locations based on certification type ONLY - no distance limits applied
  const filteredLocations = useMemo(() => {
    // Skip filtering if inputs haven't changed
    if (
      prevLocationsRef.current === locations &&
      prevSelectedTypeRef.current === selectedType &&
      filteredLocationsRef.current.length > 0
    ) {
      return filteredLocationsRef.current;
    }
    
    // Update refs to track current inputs
    prevLocationsRef.current = locations;
    prevSelectedTypeRef.current = selectedType;
    
    // Return all locations if "all" is selected 
    if (selectedType === 'all') {
      filteredLocationsRef.current = locations;
      return locations;
    }
    
    // Perform filtering in a performant way
    const filteredResults = locations.filter(location => {
      // Skip locations without any certification
      if (!location.certification && !location.isDarkSkyReserve) {
        return false;
      }
      
      const certification = (location.certification || '').toLowerCase();
      
      // Check certification type with expanded matching
      switch (selectedType) {
        case 'reserve':
          return certification.includes('reserve') || 
                 certification.includes('sanctuary') ||
                 Boolean(location.isDarkSkyReserve);
        case 'park':
          return certification.includes('park');
        case 'community':
          return certification.includes('community');
        case 'urban':
          return certification.includes('urban') || 
                 certification.includes('night sky place');
        case 'lodging':
          return certification.includes('lodging');
        default:
          return true;
      }
    });
    
    filteredLocationsRef.current = filteredResults;
    return filteredResults;
  }, [locations, selectedType]);

  return { filteredLocations };
}
