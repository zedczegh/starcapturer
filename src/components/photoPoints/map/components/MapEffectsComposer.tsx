
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapEffectsComposerProps {
  showRadiusCircles: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  isForecastMode: boolean;
  onMapClick?: (e: any) => void;
}

export const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({
  showRadiusCircles,
  userLocation,
  activeView,
  isForecastMode,
  onMapClick,
}) => {
  const map = useMap();
  
  // Apply any map-wide effects or behaviors when dependencies change
  useEffect(() => {
    if (!map) return;
    
    // Force a map refresh when view changes
    map.invalidateSize();
    
    // Optionally zoom to fit user location or apply other effects
    if (userLocation && activeView === 'calculated') {
      // Could auto-adjust zoom or perform other map manipulations here
    }
    
    // Could set different backgrounds or styles based on active view
    const container = map.getContainer();
    if (isForecastMode) {
      container.classList.add('forecast-mode');
    } else {
      container.classList.remove('forecast-mode');
    }
    
  }, [map, userLocation, activeView, isForecastMode]);
  
  return null; // This is a behavior component, not a visual one
};
