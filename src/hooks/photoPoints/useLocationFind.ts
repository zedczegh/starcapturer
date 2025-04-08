
import { useCallback } from 'react';
import { findLocationsWithinRadius as apiLocationFind } from '@/services/locationSearchService';
import { sortLocationsByQuality as apiSortQuality } from '@/services/locationSearchService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to abstract location finding functionality from useRecommendedLocations
 */
export const useLocationFind = () => {
  // Find locations within a specified radius
  const findLocationsWithinRadius = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<SharedAstroSpot[]> => {
    // Cast to ensure type compatibility
    return (await apiLocationFind(latitude, longitude, radius)) as SharedAstroSpot[];
  }, []);

  // Sort locations by quality and distance
  const sortLocationsByQuality = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    // Cast to ensure type compatibility 
    return apiSortQuality(locations) as SharedAstroSpot[];
  }, []);

  return {
    findLocationsWithinRadius,
    sortLocationsByQuality
  };
};
