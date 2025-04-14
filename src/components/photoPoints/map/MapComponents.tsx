
import React from 'react';
import { WorldBoundsController } from './MapEffectsController';
import SiqsEffectsController from './effects/SiqsEffectsController';
import RadarSweepAnimation from './RadarSweepAnimation';

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

      {/* Radar sweep animation */}
      {activeView === 'calculated' && userLocation && (
        <RadarSweepAnimation 
          userLocation={userLocation}
          searchRadius={searchRadius}
          isScanning={isScanning}
        />
      )}
    </>
  );
};

export { MapEffectsComposer };
