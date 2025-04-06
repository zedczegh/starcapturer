
/**
 * Hook to abstract calculated location finding functionality from useRecommendedLocations
 */
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findCalculatedLocations as apiFindCalculated } from '@/services/locationSearchService';

export const useCalculatedLocationsFind = () => {
  // Find calculated locations with better sky quality
  const findCalculatedLocations = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number,
    allowExpand: boolean = true,
    maxResults: number = 10
  ): Promise<SharedAstroSpot[]> => {
    return apiFindCalculated(
      latitude, 
      longitude, 
      radius,
      allowExpand,
      maxResults
    );
  }, []);

  return {
    findCalculatedLocations
  };
};
