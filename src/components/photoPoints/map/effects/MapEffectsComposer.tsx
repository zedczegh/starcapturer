
import React from 'react';
import { useMap } from 'react-leaflet';
import { WorldBoundsController } from '../MapEffectsController';
import SiqsEffectsController from './SiqsEffectsController';

interface MapEffectsComposerProps {
  center?: [number, number];
  zoom?: number;
}

/**
 * A component that composes various map effects
 */
const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({ 
  center,
  zoom
}) => {
  const map = useMap();
  
  // Set view when center changes
  React.useEffect(() => {
    if (!map || !center) return;
    
    map.setView(center, zoom || map.getZoom());
  }, [map, center, zoom]);
  
  return (
    <>
      {/* Apply world bounds limit */}
      <WorldBoundsController />
      
      {/* Apply SIQS-specific effects */}
      <SiqsEffectsController />
    </>
  );
};

export default MapEffectsComposer;
