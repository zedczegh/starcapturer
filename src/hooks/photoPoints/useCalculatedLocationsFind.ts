
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
    limit?: number,
    preserveLocations: boolean = false,
    previousLocations: SharedAstroSpot[] = []
  ): Promise<SharedAstroSpot[]> => {
    const results = await apiFindCalculated(latitude, longitude, radius, allowExpansion, limit);
    
    if (preserveLocations && previousLocations.length > 0) {
      // Filter out duplicates based on coordinates (with small tolerance)
      const existingCoords = new Set(previousLocations.map(loc => 
        `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
      ));
      
      // Only add new locations that don't exist in the previous set
      const uniqueNewLocations = results.filter(loc => {
        const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
        return !existingCoords.has(coordKey);
      });
      
      // Combine previous locations with new unique ones
      return [...previousLocations, ...uniqueNewLocations];
    }
    
    return results;
  }, []);

  return {
    findCalculatedLocations
  };
};
