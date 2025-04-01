
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findCalculatedLocations as findLocations } from '@/services/locationSearchService';

export const useCalculatedLocationsFinding = () => {
  const findCalculatedLocations = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number,
    allowExpansion: boolean = true,
    limit: number = 10,
    preservePrevious: boolean = false,
    previousLocations: SharedAstroSpot[] = []
  ): Promise<SharedAstroSpot[]> => {
    return await findLocations(
      latitude,
      longitude,
      radius,
      allowExpansion,
      limit,
      preservePrevious,
      previousLocations
    );
  }, []);

  return { findCalculatedLocations };
};
