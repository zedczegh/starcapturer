
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useNavigate } from 'react-router-dom';
import { prepareLocationForNavigation } from '@/utils/locationNavigation';

export const useMapUtils = () => {
  const navigate = useNavigate();

  const getZoomLevel = useCallback((radius: number): number => {
    // Adjust zoom level based on search radius
    if (radius <= 10) return 12;
    if (radius <= 50) return 10;
    if (radius <= 100) return 9;
    if (radius <= 300) return 8;
    if (radius <= 500) return 7;
    return 6;
  }, []);

  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (!location) return;
    
    try {
      const navigationData = prepareLocationForNavigation(location);
      
      if (navigationData) {
        navigate(`/location/${navigationData.locationId}`, { 
          state: navigationData.locationState 
        });
        console.log("Opening location details", navigationData.locationId);
      }
    } catch (error) {
      console.error("Error navigating to location details:", error, location);
    }
  }, [navigate]);

  return {
    getZoomLevel,
    handleLocationClick
  };
};

export { useMapLocations } from './useMapLocations';
