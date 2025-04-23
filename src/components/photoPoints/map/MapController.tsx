
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';

export interface MapControllerProps {
  userLocation?: { latitude: number; longitude: number } | null;
  searchRadius?: number;
  onMapClick?: (lat: number, lng: number) => void;
}

const MapController: React.FC<MapControllerProps> = ({
  userLocation,
  searchRadius,
  onMapClick
}) => {
  const map = useMap();
  
  // Handle map click events
  useEffect(() => {
    if (!map || !onMapClick) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null; // This is a headless component
};

export default MapController;
