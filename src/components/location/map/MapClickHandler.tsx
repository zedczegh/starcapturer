
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
}

/**
 * Component that handles map click events and passes coordinates to the onClick callback
 */
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onClick }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Add click handler
    const handleMapClick = (e: any) => {
      const { lat, lng } = e.latlng;
      onClick(lat, lng);
    };
    
    map.on('click', handleMapClick);
    
    // Clean up when component unmounts
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onClick]);
  
  return null;
};

export default MapClickHandler;
