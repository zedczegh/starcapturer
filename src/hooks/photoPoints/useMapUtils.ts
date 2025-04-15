
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

export const useMapUtils = () => {
  /**
   * Calculate the appropriate zoom level based on the search radius
   */
  const getZoomLevel = (radius: number): number => {
    if (radius <= 10) return 12;
    if (radius <= 25) return 11;
    if (radius <= 50) return 10;
    if (radius <= 100) return 9;
    if (radius <= 250) return 8;
    if (radius <= 500) return 7;
    if (radius <= 1000) return 6;
    return 5; // For very large radius
  };

  /**
   * Handle location click with tooltip display and navigation
   */
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    console.log("Location clicked:", location);
  }, []);

  return {
    getZoomLevel,
    handleLocationClick
  };
};

// Make sure MapLocations is properly exported
export { useMapLocations } from './useMapLocations';
