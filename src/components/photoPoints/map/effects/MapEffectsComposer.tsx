import React from 'react';
import { useMap } from 'react-leaflet';
import { WorldBoundsController } from '../MapEffectsController';
import SiqsEffectsController from './SiqsEffectsController';
import RadarSweepAnimation from '../RadarSweepAnimation';

interface MapEffectsComposerProps {
  center?: [number, number];
  zoom?: number;
  userLocation?: { latitude: number; longitude: number } | null;
  activeView?: 'certified' | 'calculated';
  searchRadius?: number;
  onSiqsCalculated?: (siqs: number) => void;
  isScanning?: boolean;
  isManualRadiusChange?: boolean;
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
  isScanning = false,
  isManualRadiusChange = false
}) => {
  const map = useMap();
  
  // Only update center position, keep current zoom level
  React.useEffect(() => {
    if (!map || !center) return;
    
    // Only set the center, not the zoom level
    map.setView(center, map.getZoom());
  }, [map, center]);
  
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
      
      {/* Radar sweep animation - only show for calculated view */}
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

export default MapEffectsComposer;
