
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
    try {
      return await apiLocationFind(latitude, longitude, radius);
    } catch (error) {
      console.error("Error finding locations within radius:", error);
      return [];
    }
  }, []);

  // Sort locations by quality and distance
  const sortLocationsByQuality = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    try {
      return apiSortQuality(locations);
    } catch (error) {
      console.error("Error sorting locations by quality:", error);
      // Fallback sorting by SIQS score if API fails
      return [...locations].sort((a, b) => {
        const aSiqs = a.siqsResult?.score ?? a.siqs ?? 0;
        const bSiqs = b.siqsResult?.score ?? b.siqs ?? 0;
        return bSiqs - aSiqs;
      });
    }
  }, []);

  return {
    findLocationsWithinRadius,
    sortLocationsByQuality
  };
};
