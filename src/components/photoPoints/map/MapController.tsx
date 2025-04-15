
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
}

const MapController: React.FC<MapControllerProps> = ({ userLocation, searchRadius }) => {
  const map = useMap();
  
  // Center the map on user location only when component mounts or when explicitly requested
  useEffect(() => {
    if (userLocation && map) {
      // Only center on initial mount, no dependency on userLocation to prevent re-centering
      map.setView([userLocation.latitude, userLocation.longitude], getZoomLevel());
    }
  }, [map]); // Only depend on map, not userLocation to prevent re-centering
  
  // Calculate zoom level based on search radius
  const getZoomLevel = () => {
    // Set very zoomed out default view (almost world-view)
    if (searchRadius >= 500) return 3;
    if (searchRadius <= 10) return 12;
    if (searchRadius <= 50) return 10;
    if (searchRadius <= 100) return 9;
    if (searchRadius <= 300) return 8;
    return 5; // Default to more zoomed out view
  };

  return null;
};

export default MapController;
