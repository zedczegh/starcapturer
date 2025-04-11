
import { useCallback } from 'react';
import { findLocationsWithinRadius as apiLocationFind } from '@/services/locationSearchService';
import { sortLocationsByQuality as apiSortQuality } from '@/services/locationSearchService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findCertifiedLocations } from '@/services/locationSearchService';

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

  // Find certified locations within a specified radius
  const findCertifiedLocationsWithinRadius = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number,
    limit: number = 100
  ): Promise<SharedAstroSpot[]> => {
    return findCertifiedLocations(latitude, longitude, radius, limit);
  }, []);

  // Sort locations by quality and distance
  const sortLocationsByQuality = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    return apiSortQuality(locations);
  }, []);

  return {
    findLocationsWithinRadius,
    findCertifiedLocationsWithinRadius,
    sortLocationsByQuality
  };
};
