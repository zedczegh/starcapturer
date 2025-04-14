
import React from 'react';
import { useMap } from 'react-leaflet';
import { WorldBoundsController } from '../MapEffectsController';
import SiqsEffectsController from './SiqsEffectsController';

interface MapEffectsComposerProps {
  center?: [number, number];
  zoom?: number;
  userLocation?: { latitude: number; longitude: number } | null;
  activeView?: 'certified' | 'calculated';
  searchRadius?: number;
  onSiqsCalculated?: (siqs: number) => void;
  isScanning?: boolean;
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
  onSiqsCalculated,
  isScanning = false
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
      <SiqsEffectsController 
        userLocation={userLocation}
        activeView={activeView}
        searchRadius={searchRadius}
        onSiqsCalculated={onSiqsCalculated}
      />
    </>
  );
};

export default MapEffectsComposer;
