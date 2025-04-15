
import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapEffectsComposerProps {
  effects?: ('leaflet-fullscreen' | 'zoom-controls' | 'scale')[];
  userLocation?: { latitude: number; longitude: number } | null;
  activeView?: 'certified' | 'calculated';
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
    
    if (effects.includes('scale')) {
      // Add scale control if needed
      L.control.scale({ position: 'bottomleft' }).addTo(map);
    }
    
    // If we have user location and view mode, we could add additional effects here
    if (userLocation && activeView) {
      console.log(`Map effects applied for ${activeView} view with radius ${searchRadius}km`);
    }
    
    return () => {
      // Clean up effects if needed
      if (effects.includes('scale')) {
        // Remove scale control if it exists
        map.eachLayer((layer) => {
          if (layer instanceof L.Control.Scale) {
            map.removeControl(layer);
          }
        });
      }
    };
  }, [map, effects, userLocation, activeView, searchRadius]);
  
  return null; // This component doesn't render anything visible
};

export default MapEffectsComposer;
