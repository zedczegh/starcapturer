
import React from 'react';
import { useMapEvents } from 'react-leaflet';

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
  // Handle map click events
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  return null; // This is a headless component
};

export default MapController;
