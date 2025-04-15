
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
}

const MapController: React.FC<MapControllerProps> = ({ userLocation, searchRadius }) => {
  const map = useMap();
  
  // Center the map ONLY on initial mount, not when location changes
  useEffect(() => {
    if (map) {
      // Initial setup only, do not add userLocation as dependency
      const zoomLevel = getZoomLevel();
      console.log(`Setting initial map view with zoom level: ${zoomLevel}`);
      
      // Only set the initial view - don't recenter when location changes
      if (userLocation) {
        // Set initial view without animation for smoother startup
        map.setView([userLocation.latitude, userLocation.longitude], zoomLevel, {
          animate: false,
        });
      }
    }
  }, [map]); // Only depend on map, not userLocation
  
  // Calculate zoom level based on search radius
  const getZoomLevel = () => {
    // Very zoomed out view for larger context
    if (searchRadius >= 500) return 3;
    if (searchRadius <= 10) return 12;
    if (searchRadius <= 50) return 10;
    if (searchRadius <= 100) return 9;
    if (searchRadius <= 300) return 7;
    return 4; // Default to more zoomed out view
  };

  return null;
};

export default MapController;
