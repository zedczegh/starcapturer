
import React from 'react';
import { useMap } from 'react-leaflet';

interface MapEffectsControllerProps {
  onMapClick: (lat: number, lng: number) => void;
}

export const MapEvents: React.FC<MapEffectsControllerProps> = ({ onMapClick }) => {
  const map = useMap();

  // Set up map click event handler
  React.useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMapClick]);

  return null;
};

export default MapEvents;
