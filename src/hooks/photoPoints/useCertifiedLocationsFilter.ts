
import { useMemo, useEffect } from 'react';
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
  // Debug logging for certified locations
  useEffect(() => {
    console.log(`Received ${locations.length} certified locations for filtering`);
    
    if (locations.length > 0) {
      // Count by certification type for debugging
      const certTypes = {
        reserve: 0,
        park: 0,
        community: 0,
        urban: 0,
        lodging: 0,
        other: 0
      };
      
      locations.forEach(loc => {
        const cert = (loc.certification || '').toLowerCase();
        if (cert.includes('reserve') || Boolean(loc.isDarkSkyReserve)) {
          certTypes.reserve++;
        } else if (cert.includes('park')) {
          certTypes.park++;
        } else if (cert.includes('community')) {
          certTypes.community++;
        } else if (cert.includes('urban') || cert.includes('night sky place')) {
          certTypes.urban++;
        } else if (cert.includes('lodging') || cert.includes('friendly lodging')) {
          certTypes.lodging++;
        } else {
          certTypes.other++;
        }
      });
      
      console.log("Certification type counts:", certTypes);
    }
  }, [locations]);
  
  // Filter locations based on certification type ONLY - no distance limits applied
  const filteredLocations = useMemo(() => {
    if (selectedType === 'all') {
      return locations;
    }
    
    return locations.filter(location => {
      // Skip locations without any certification
      if (!location.certification && !location.isDarkSkyReserve) {
        return false;
      }
      
      const certification = (location.certification || '').toLowerCase();
      const locationType = (location.type || '').toLowerCase();
      
      // Check certification type with expanded matching
      switch (selectedType) {
        case 'reserve':
          return certification.includes('reserve') || 
                 certification.includes('sanctuary') ||
                 Boolean(location.isDarkSkyReserve) ||
                 locationType === 'dark-site';
        case 'park':
          return certification.includes('park') ||
                 locationType === 'park';
        case 'community':
          return certification.includes('community') ||
                 locationType === 'community';
        case 'urban':
          return certification.includes('urban') || 
                 certification.includes('night sky place') ||
                 locationType === 'urban';
        case 'lodging':
          return certification.includes('lodging') || 
                 certification.includes('friendly') ||
                 locationType === 'lodging';
        default:
          return true;
      }
    });
  }, [locations, selectedType]);
  
  // Log filtered results for debugging
  useEffect(() => {
    console.log(`Filtered to ${filteredLocations.length} ${selectedType} locations`);
  }, [filteredLocations, selectedType]);

  return { filteredLocations };
}
