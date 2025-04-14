
import React from 'react';
import { WorldBoundsController } from '../MapEffectsController';
import SiqsEffectsController from './SiqsEffectsController';
import RadarSweepAnimation from '../RadarSweepAnimation';

interface MapEffectsComposerProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
  isScanning?: boolean;
  isManualRadiusChange?: boolean;
}

const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated,
  isScanning = false,
  isManualRadiusChange = false
}) => {
  // Only render radar animation for calculated view
  const showRadar = activeView === 'calculated' && isScanning;

  return (
    <>
      {/* Apply world bounds to prevent infinite scrolling */}
      <WorldBoundsController />
      
      {/* Apply SIQS effects if user location is available */}
      {userLocation && (
        <SiqsEffectsController
          userLocation={userLocation}
          activeView={activeView}
          isScanning={isScanning}
          searchRadius={searchRadius}
          onSiqsCalculated={onSiqsCalculated}
        />
      )}
      
      {/* Show radar animation only for calculated view */}
      {showRadar && userLocation && (
        <RadarSweepAnimation
          position={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters
          isScanning={isScanning}
          isManualRadiusChange={isManualRadiusChange}
        />
      )}
    </>
  );
};

export default MapEffectsComposer;
