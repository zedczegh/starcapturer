
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapCenterHandlerProps {
  center: [number, number];
}

export const MapCenterHandler: React.FC<MapCenterHandlerProps> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2 && 
        isFinite(center[0]) && isFinite(center[1]) &&
        Math.abs(center[0]) <= 90 && Math.abs(center[1]) <= 180) {
      map.setView(center, map.getZoom(), { animate: false });
    }
  }, [center, map]);
  
  return null;
};
