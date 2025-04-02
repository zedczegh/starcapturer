
import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { darkSkyLocations } from '@/data/regions/darkSkyLocations';
import { calculateDistance } from '@/utils/locationUtils';

/**
 * A hook for finding locations with optimized algorithms
 */
export function useOptimizedLocationFind() {
  const { t } = useLanguage();
  const [searching, setSearching] = useState(false);
  
  /**
   * Find locations within a specified radius
   * @param latitude Center latitude
   * @param longitude Center longitude
   * @param radius Radius in kilometers
   * @returns Promise resolving to array of locations within radius
   */
  const findLocationsWithinRadius = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number = 1000
  ): Promise<SharedAstroSpot[]> => {
    setSearching(true);
    try {
      console.log(`Finding dark sky locations within ${radius}km of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      
      // Use our dark sky locations database
      const locationsWithinRadius = darkSkyLocations
        .map(location => {
          // Calculate distance to each location
          const distance = calculateDistance(
            latitude,
            longitude,
            location.coordinates[0],
            location.coordinates[1]
          );
          
          // Return only locations within radius
          if (distance <= radius) {
            return {
              id: `dsl-${location.name.replace(/\s+/g, '-').toLowerCase()}`,
              name: location.name,
              latitude: location.coordinates[0],
              longitude: location.coordinates[1],
              bortleScale: location.bortleScale,
              distance,
              certification: location.name.includes("Dark Sky") ? "Dark Sky" : undefined,
              isDarkSkyReserve: location.name.includes("Reserve"),
              isDarkSkyPark: location.name.includes("Park"),
              isDarkSkySanctuary: location.name.includes("Sanctuary"),
              type: location.type,
            } as SharedAstroSpot;
          }
          return null;
        })
        .filter(Boolean) as SharedAstroSpot[];
      
      console.log(`Found ${locationsWithinRadius.length} dark sky locations within ${radius}km`);
      
      return locationsWithinRadius;
    } catch (error) {
      console.error("Error finding locations within radius:", error);
      return [];
    } finally {
      setSearching(false);
    }
  }, []);
  
  /**
   * Sort locations by quality and distance
   * @param locations Array of locations to sort
   * @returns Sorted array of locations
   */
  const sortLocationsByQuality = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    if (!locations || locations.length === 0) return [];
    
    return [...locations].sort((a, b) => {
      // First sort by SIQS if available
      if (a.siqs !== undefined && b.siqs !== undefined) {
        if (a.siqs !== b.siqs) {
          return b.siqs - a.siqs;
        }
      }
      
      // Then sort by bortle scale
      const bortleA = a.bortleScale || 5;
      const bortleB = b.bortleScale || 5;
      
      if (bortleA !== bortleB) {
        return bortleA - bortleB;
      }
      
      // Finally sort by distance
      return (a.distance || 0) - (b.distance || 0);
    });
  }, []);
  
  return {
    findLocationsWithinRadius,
    sortLocationsByQuality,
    searching
  };
}
