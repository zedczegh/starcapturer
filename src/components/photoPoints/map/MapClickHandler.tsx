
import React from 'react';
import { useMap } from 'react-leaflet';

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (!map) return;
    
    const handleMapClick = (e: any) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMapClick]);

  return null;
};

export default MapClickHandler;
