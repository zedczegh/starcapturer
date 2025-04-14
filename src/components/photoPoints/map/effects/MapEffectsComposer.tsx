
import React from 'react';
import { useMap } from 'react-leaflet';
import { WorldBoundsController } from '../MapEffectsController';

interface MapEffectsComposerProps {
  center?: [number, number];
  zoom?: number;
  userLocation?: { latitude: number; longitude: number } | null;
  activeView?: 'certified' | 'calculated';
  searchRadius?: number;
  onSiqsCalculated?: (siqs: number) => void;
}

/**
 * A component that composes various map effects
 */
const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({ 
  center,
  zoom,
  userLocation,
  activeView = 'certified',
  searchRadius = 100,
  onSiqsCalculated
}) => {
  const map = useMap();
  
  // Set view when center changes
  React.useEffect(() => {
    if (!map || !center) return;
    
    // Use flyTo for smoother transitions
    map.flyTo(center, zoom || map.getZoom(), {
      duration: 0.8,  // Shorter animation time for better performance
      easeLinearity: 0.5
    });
  }, [map, center, zoom]);
  
  return (
    <>
      {/* Apply world bounds limit */}
      <WorldBoundsController />
    </>
  );
};

export default MapEffectsComposer;
