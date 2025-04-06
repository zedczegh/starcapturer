
import { useCallback } from 'react';
import { findCalculatedLocations as apiCalculatedLocations } from '@/services/locationSearchService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook for finding calculated locations based on current position
 */
export const useCalculatedLocationsFind = () => {
  // Max radius to prevent API overload
  const MAX_SEARCH_RADIUS = 1000; // 1000 km max
  
  // Find calculated locations within radius with expansion capability
  const findCalculatedLocations = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number,
    allowExpansion: boolean = true,
    limit: number = 10,
    preservePrevious: boolean = false,
    previousLocations: SharedAstroSpot[] = [],
  ): Promise<SharedAstroSpot[]> => {
    // Enforce maximum radius limit
    const safeRadius = Math.min(radius, MAX_SEARCH_RADIUS);
    
    return apiCalculatedLocations(
      latitude, 
      longitude, 
      safeRadius,
      allowExpansion,
      limit,
      preservePrevious,
      previousLocations
    );
  }, []);

  return {
    findCalculatedLocations,
    MAX_SEARCH_RADIUS
  };
};
