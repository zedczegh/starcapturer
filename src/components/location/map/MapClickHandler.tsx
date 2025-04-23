
import React from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
}

/**
 * Component that handles map click events and passes coordinates to the onClick callback
 */
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onClick }) => {
  // Use useMap hook instead of useMapEvents
  const map = useMap();
  
  // Add click event listener when the component mounts
  React.useEffect(() => {
    if (!map) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      console.log("Map clicked at:", lat, lng);
      onClick(lat, lng);
    };
    
    // Add event listener
    map.on('click', handleMapClick);
    
    // Clean up event listener when component unmounts
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onClick]);
  
  return null;
};

export default MapClickHandler;
