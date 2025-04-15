
import { useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export const useMapEvents = (onMapClick: (lat: number, lng: number) => void) => {
  const map = useMap();

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    onMapClick(e.latlng.lat, e.latlng.lng);
  }, [onMapClick]);

  return {
    handleMapClick
  };
};

export default useMapEvents;
