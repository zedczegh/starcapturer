
import React from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';

interface MapEffectsComposerProps {
  effects?: ('leaflet-fullscreen' | 'zoom-controls')[];  // Removed 'scale' from this array
  userLocation?: { latitude: number; longitude: number } | null;
  activeView?: 'certified' | 'calculated' | 'obscura';
  searchRadius?: number;
}

const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({ 
  effects = [],
  userLocation,
  activeView,
  searchRadius
}) => {
  const map = useMap();
  
  React.useEffect(() => {
    // Apply various map effects based on props
    if (effects.includes('zoom-controls')) {
      // Add zoom controls if not already added
      if (!map.zoomControl) {
        map.addControl(L.control.zoom({ position: 'bottomright' }));
      }
    }
    
    // Removed scale control - we no longer add it
    
    // If we have user location and view mode, we could add additional effects here
    if (userLocation && activeView) {
      console.log(`Map effects applied for ${activeView} view with radius ${searchRadius}km`);
    }
    
    return () => {
      // Clean up effects if needed (no need to clean up scale control anymore)
    };
  }, [map, effects, userLocation, activeView, searchRadius]);
  
  return null; // This component doesn't render anything visible
};

export default MapEffectsComposer;
