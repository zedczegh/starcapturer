
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
}

const MapController: React.FC<MapControllerProps> = ({ userLocation, searchRadius }) => {
  const map = useMap();
  
  // Center the map on user location if available
  useEffect(() => {
    if (userLocation && map) {
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
    }
  }, [userLocation, map]);
  
  // Update zoom level based on search radius
  useEffect(() => {
    if (!map) return;
    
    // Adjust zoom level based on search radius
    const getZoomLevel = () => {
      if (searchRadius <= 10) return 12;
      if (searchRadius <= 50) return 10;
      if (searchRadius <= 100) return 9;
      if (searchRadius <= 300) return 8;
      if (searchRadius <= 500) return 7;
      return 6;
    };
    
    const zoom = getZoomLevel();
    if (map.getZoom() !== zoom) {
      map.setZoom(zoom);
    }
  }, [searchRadius, map]);

  return null;
};

export default MapController;
