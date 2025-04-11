
import { useCallback } from 'react';
import { findLocationsWithinRadius as apiLocationFind } from '@/services/locationSearchService';
import { sortLocationsByQuality as apiSortQuality } from '@/services/locationSearchService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService';
import { isWaterLocation } from '@/utils/locationValidator';

/**
 * Hook to abstract location finding functionality from useRecommendedLocations
 * Improved version with validation and filtering
 */
export const useLocationFind = () => {
  // Find locations within a specified radius
  const findLocationsWithinRadius = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<SharedAstroSpot[]> => {
    try {
      const locations = await apiLocationFind(latitude, longitude, radius);
      
      // Filter out invalid locations
      return locations.filter(loc => {
        // Filter out locations without coordinates
        if (!loc.latitude || !loc.longitude) {
          return false;
        }
        
        // For calculated spots (non-certified), filter out water locations
        if (!loc.isDarkSkyReserve && !loc.certification) {
          if (isWaterLocation(loc.latitude, loc.longitude)) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      console.error("Error finding locations within radius:", error);
      return [];
    }
  }, []);

  // Sort locations by quality and distance
  const sortLocationsByQuality = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    return apiSortQuality(locations);
  }, []);

  // Update locations with real-time SIQS data
  const updateLocationsWithSiqs = useCallback(async (
    locations: SharedAstroSpot[]
  ): Promise<SharedAstroSpot[]> => {
    try {
      return await updateLocationsWithRealTimeSiqs(locations);
    } catch (error) {
      console.error("Error updating locations with SIQS:", error);
      return locations;
    }
  }, []);

  return {
    findLocationsWithinRadius,
    sortLocationsByQuality,
    updateLocationsWithSiqs
  };
};
