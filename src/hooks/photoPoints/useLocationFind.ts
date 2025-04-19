
import { useCallback } from 'react';
import { findLocationsWithinRadius as apiLocationFind } from '@/services/location/locationSearchService';
import { sortLocationsByQuality as apiSortQuality } from '@/services/location/locationQualityService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { DEFAULT_CERTIFIED_RADIUS } from '@/utils/constants';

/**
 * Hook to abstract location finding functionality
 */
export const useLocationFind = () => {
  // Find locations within a specified radius
  const findLocationsWithinRadius = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number,
    isCertified = false
  ): Promise<SharedAstroSpot[]> => {
    // For certified locations, use a much larger radius to get all global locations
    const effectiveRadius = isCertified ? DEFAULT_CERTIFIED_RADIUS : radius;
    return apiLocationFind(latitude, longitude, effectiveRadius);
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
