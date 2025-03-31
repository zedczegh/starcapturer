
import React, { useCallback, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapComponentProps {
  onMapClick?: (lat: number, lng: number) => void;
  onMapMove?: (lat: number, lng: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onMapClick, onMapMove }) => {
  const map = useMap();

  // Handle map click events
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (onMapClick) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  }, [onMapClick]);

  // Handle map move events
  const handleMapMove = useCallback(() => {
    if (onMapMove) {
      const center = map.getCenter();
      onMapMove(center.lat, center.lng);
    }
  }, [map, onMapMove]);

  // Set up event listeners
  useEffect(() => {
    if (onMapClick) {
      map.on('click', handleMapClick);
    }
    
    if (onMapMove) {
      map.on('moveend', handleMapMove);
    }

    return () => {
      if (onMapClick) {
        map.off('click', handleMapClick);
      }
      
      if (onMapMove) {
        map.off('moveend', handleMapMove);
      }
    };
  }, [map, handleMapClick, handleMapMove, onMapClick, onMapMove]);

  return null;
};

export default MapComponent;
