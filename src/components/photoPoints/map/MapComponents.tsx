
import React from 'react';
import { MapEffectsComposer as BaseMapEffectsComposer } from './effects/MapEffectsComposer';

interface MapEffectsComposerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
  disableAutoCenter?: boolean;
}

/**
 * Wrapper for MapEffectsComposer with additional props
 */
export const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated,
  disableAutoCenter = true // Default to disable auto-centering
}) => {
  return (
    <BaseMapEffectsComposer
      userLocation={userLocation}
      activeView={activeView}
      searchRadius={searchRadius}
      onSiqsCalculated={onSiqsCalculated}
      disableAutoCenter={disableAutoCenter}
    />
  );
};
