
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/types/weather';
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

export const useMapLocations = ({
  userLocation,
  locations,
  searchRadius,
  activeView,
  mapReady
}: {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  mapReady: boolean;
}) => {
  // Ensure locations is always an array even if it's undefined or null
  const safeLocations = Array.isArray(locations) ? locations : [];
  
  // Log counts of locations by type for debugging
  const certifiedCount = safeLocations.filter(loc => 
    Boolean(loc?.isDarkSkyReserve || loc?.certification)
  ).length;
  
  const calculatedCount = safeLocations.length - certifiedCount;
  
  console.log(`Location counts - certified: ${certifiedCount}, calculated: ${calculatedCount}, total: ${safeLocations.length}`);
  
  // Apply basic filtering to remove invalid locations
  const validLocations = safeLocations.filter(loc => 
    loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
  );
  
  return {
    // Return all valid locations without further filtering
    processedLocations: validLocations
  };
};
