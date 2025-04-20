
import { useCallback } from 'react';
import { findLocationsWithinRadius as apiLocationFind, sortLocationsByQuality as apiSortQuality } from '@/services/locationSearchService';
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
    return apiLocationFind(latitude, longitude, radius);
  }, []);

  // Sort locations by quality and distance
  const sortLocationsByQuality = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    return apiSortQuality(locations);
  }, []);

  return {
    findLocationsWithinRadius,
    sortLocationsByQuality
  };
};
