
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findLocationsWithinRadius as findLocations } from '@/services/locationSearchService';

export const useLocationFinding = () => {
  const findLocationsWithinRadius = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number,
    certifiedOnly: boolean = false,
    limit: number = 100
  ): Promise<SharedAstroSpot[]> => {
    return await findLocations(
      latitude,
      longitude,
      radius,
      certifiedOnly,
      limit
    );
  }, []);

  return { findLocationsWithinRadius };
};
