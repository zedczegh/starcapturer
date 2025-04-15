
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

/**
 * Composes multiple map effects into a single component
 */
const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({ 
  userLocation,
  activeView = 'certified',
  searchRadius = 100,
  onSiqsCalculated
}) => {
  // Always call useMap
  const map = useMap();
  
  return (
    <>
      {/* Apply world bounds limit with more forgiving bounds */}
      <WorldBoundsController />
      
      {/* Apply SIQS-specific effects if userLocation is available */}
      {userLocation ? (
        <SiqsEffectsController 
          userLocation={userLocation}
          activeView={activeView}
          searchRadius={searchRadius}
          onSiqsCalculated={onSiqsCalculated}
        />
      ) : null}
    </>
  );
};

export default MapEffectsComposer;
