
import { useCallback } from 'react';
import { findCalculatedLocations as apiFindCalculated } from '@/services/locationSearchService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to abstract calculated locations finding functionality
 */
export const useCalculatedLocationsFind = () => {
  // Find calculated locations 
  const findCalculatedLocations = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number,
    allowExpansion?: boolean,
    limit?: number
  ): Promise<SharedAstroSpot[]> => {
    return apiFindCalculated(latitude, longitude, radius, allowExpansion, limit);
  }, []);

  return {
    findCalculatedLocations
  };
};
