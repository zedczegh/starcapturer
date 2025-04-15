
import React from 'react';
import { useMap } from 'react-leaflet';
import { WorldBoundsController } from '../MapEffectsController';
import SiqsEffectsController from './SiqsEffectsController';

interface MapEffectsComposerProps {
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
  
  // No auto-zoom or auto-center functionality
  
  return (
    <>
      {/* Apply world bounds limit with more forgiving bounds */}
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

