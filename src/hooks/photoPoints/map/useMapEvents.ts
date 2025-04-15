
import { useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export const useMapEvents = (onMapClick: (lat: number, lng: number) => void) => {
  const map = useMap();

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    onMapClick(e.latlng.lat, e.latlng.lng);
  }, [onMapClick]);
  
  // Attach map click event listener
  map.on('click', handleMapClick);
  
  // Clean up event listener to prevent memory leaks
  return () => {
    map.off('click', handleMapClick);
  };
};

export default useMapEvents;
