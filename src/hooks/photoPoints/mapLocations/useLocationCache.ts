
import { useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to manage location caching
 */
export const useLocationCache = () => {
  const previousLocationsRef = useRef<Map<string, SharedAstroSpot>>(new Map());
  const locationCacheRef = useRef<Map<string, SharedAstroSpot>>(new Map());
  
  /**
   * Add locations to the cache
   */
  const updateCache = (locations: SharedAstroSpot[]) => {
    locations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        locationCacheRef.current.set(key, loc);
      }
    });
  };
  
  /**
   * Get cached locations for view switching
   */
  const getCachedLocationsForView = (activeView: 'certified' | 'calculated'): SharedAstroSpot[] => {
    const cachedLocations = Array.from(locationCacheRef.current.values());
    
    // Filter cached locations by type based on active view
    return activeView === 'certified' 
      ? cachedLocations.filter(loc => loc.isDarkSkyReserve || loc.certification)
      : cachedLocations;
  };
  
  /**
   * Update previous locations reference
   */
  const updatePreviousLocations = (locationsMap: Map<string, SharedAstroSpot>) => {
    previousLocationsRef.current = locationsMap;
  };
  
  /**
   * Get previous locations reference
   */
  const getPreviousLocations = () => {
    return previousLocationsRef.current;
  };
  
  return {
    updateCache,
    getCachedLocationsForView,
    updatePreviousLocations,
    getPreviousLocations
  };
};
