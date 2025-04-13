
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';

export const useLocationProcessing = () => {
  // Filter out invalid locations and water spots
  const filterValidLocations = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    return locations.filter(location => 
      location && 
      typeof location.latitude === 'number' && 
      typeof location.longitude === 'number' &&
      // Filter out water locations for calculated spots, never filter certified
      (location.isDarkSkyReserve || 
       location.certification || 
       !isWaterLocation(location.latitude, location.longitude, false))
    );
  }, []);

  // Extract certified and calculated locations
  const separateLocationTypes = useCallback((locations: SharedAstroSpot[]) => {
    const certifiedLocations = locations.filter(location => 
      location.isDarkSkyReserve === true || 
      (location.certification && location.certification !== '')
    );
    
    const calculatedLocations = locations.filter(location => 
      !(location.isDarkSkyReserve === true || 
      (location.certification && location.certification !== ''))
    );

    return { certifiedLocations, calculatedLocations };
  }, []);

  // Merge locations according to active view
  const mergeLocations = useCallback((
    certifiedLocations: SharedAstroSpot[], 
    calculatedLocations: SharedAstroSpot[],
    activeView: 'certified' | 'calculated'
  ) => {
    // For certified view, ONLY include certified locations
    if (activeView === 'certified') {
      return certifiedLocations;
    }
    
    // For calculated view, include both types but prioritize certified locations
    const locationMap = new Map<string, SharedAstroSpot>();
    
    // Always include all certified locations regardless of active view
    certifiedLocations.forEach(loc => {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      locationMap.set(key, loc);
    });
    
    // Add calculated locations
    calculatedLocations.forEach(loc => {
      // Skip water locations for calculated spots
      if (!isWaterLocation(loc.latitude, loc.longitude)) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        const existing = locationMap.get(key);
        if (!existing || (loc.siqs && (!existing.siqs || loc.siqs > existing.siqs))) {
          locationMap.set(key, loc);
        }
      }
    });
    
    return Array.from(locationMap.values());
  }, []);

  return {
    filterValidLocations,
    separateLocationTypes,
    mergeLocations
  };
};
