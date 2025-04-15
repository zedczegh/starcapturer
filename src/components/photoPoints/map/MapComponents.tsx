
import React from 'react';
import MapEffectsComposer from './effects/MapEffectsComposer';

interface MapEffectsComposerWrapperProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
  disableAutoCenter?: boolean;
}

/**
 * Wrapper for MapEffectsComposer with additional props
 */
export const MapEffectsComposerWrapper: React.FC<MapEffectsComposerWrapperProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated,
  disableAutoCenter = true // Default to disable auto-centering
}) => {
  return (
    <MapEffectsComposer
      userLocation={userLocation}
      activeView={activeView}
      searchRadius={searchRadius}
      onSiqsCalculated={onSiqsCalculated}
      disableAutoCenter={disableAutoCenter}
    />
  );
};
