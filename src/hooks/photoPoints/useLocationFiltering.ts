
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';

/**
 * Hook to provide location filtering utilities
 */
export const useLocationFiltering = () => {
  /**
   * Filter locations by type (certified vs calculated)
   */
  const filterLocationsByType = useCallback((
    locations: SharedAstroSpot[], 
    showCertified: boolean, 
    showCalculated: boolean
  ) => {
    return locations.filter(location => {
      const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
      
      if (showCertified && isCertified) return true;
      if (showCalculated && !isCertified) return true;
      
      return false;
    });
  }, []);

  /**
   * Filter out water locations unless they are certified
   */
  const filterWaterLocations = useCallback((locations: SharedAstroSpot[]) => {
    return locations.filter(location => {
      // Skip invalid locations
      if (!location.latitude || !location.longitude) return false;
      
      // Never filter out certified locations
      if (location.isDarkSkyReserve || location.certification) {
        return true;
      }
      
      // Filter out water locations for calculated spots
      return !isWaterLocation(location.latitude, location.longitude, false);
    });
  }, []);

  /**
   * Filter locations by view type
   */
  const filterByViewType = useCallback((
    locations: SharedAstroSpot[], 
    activeView: 'certified' | 'calculated'
  ) => {
    if (activeView === 'certified') {
      return locations.filter(loc => Boolean(loc.isDarkSkyReserve || loc.certification));
    }
    return locations;
  }, []);

  return {
    filterLocationsByType,
    filterWaterLocations,
    filterByViewType
  };
};
