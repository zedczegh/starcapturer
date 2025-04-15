
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
}

const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({ 
  userLocation,
  activeView = 'certified',
  searchRadius = 100,
  onSiqsCalculated
}) => {
  const map = useMap();
  
  // All auto-zoom and auto-center functionality removed
  
  return (
    <>
      {/* Apply world bounds limit */}
      <WorldBoundsController />
      
      {/* Apply SIQS-specific effects only when userLocation is available */}
      {userLocation && (
        <SiqsEffectsController 
          userLocation={userLocation}
          activeView={activeView}
          searchRadius={searchRadius}
          onSiqsCalculated={onSiqsCalculated}
        />
      )}
    </>
  );
};

export default MapEffectsComposer;
