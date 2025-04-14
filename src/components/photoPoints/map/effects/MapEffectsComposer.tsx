
import React from 'react';
import { WorldBoundsController } from '../MapEffectsController';
import SiqsEffectsController from './SiqsEffectsController';

interface MapEffectsComposerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
}

/**
 * Component to compose all map effects in a single component
 * This makes it easier to maintain different effects and prevent prop drilling
 */
const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({
  userLocation,
  activeView, 
  searchRadius,
  onSiqsCalculated
}) => {
  return (
    <>
      {/* Prevent infinite scrolling of the map */}
      <WorldBoundsController />
      
      {/* Handle real-time SIQS calculations */}
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
