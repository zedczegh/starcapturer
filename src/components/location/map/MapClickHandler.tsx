
import React, { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
}

/**
 * Component that handles map click events and passes coordinates to the onClick callback
 */
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onClick }) => {
  // Use useMapEvents instead of useMap for event handling
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      console.log("Map clicked at:", lat, lng);
      onClick(lat, lng);
    }
  });
  
  return null;
};

export default MapClickHandler;
