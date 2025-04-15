
import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapEffectsControllerProps {
  onMapClick: (lat: number, lng: number) => void;
}

// Prevent infinite scrolling beyond world bounds
export const WorldBoundsController: React.FC = () => {
  const map = useMap();
  
  React.useEffect(() => {
    if (!map) return;
    
    // Set max bounds to prevent scrolling beyond the world
    const worldBounds = new L.LatLngBounds(
      new L.LatLng(-85.06, -180), // Southwest corner
      new L.LatLng(85.06, 180)    // Northeast corner
    );
    
    map.setMaxBounds(worldBounds);
    map.on('drag', () => {
      map.panInsideBounds(worldBounds, { animate: false });
    });
    
    return () => {
      map.off('drag');
    };
  }, [map]);
  
  return null;
};

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
