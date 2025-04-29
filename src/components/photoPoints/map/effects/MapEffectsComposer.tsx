
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapEffectsComposerProps {
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  isForecast?: boolean;
}

const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({ 
  activeView, 
  searchRadius,
  isForecast = false
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (activeView === 'calculated') {
      console.log(`Map effects applied for calculated view with radius ${searchRadius}km${isForecast ? ' (forecast mode)' : ''}`);
    } else {
      console.log('Map effects applied for certified view');
    }
    
    // Force a map redraw
    map.invalidateSize();
  }, [activeView, searchRadius, isForecast, map]);
  
  return null;
};

export default MapEffectsComposer;
