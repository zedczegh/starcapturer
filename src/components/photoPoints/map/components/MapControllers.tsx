
import React from 'react';
import MapController from '../MapController';
import MobileMapFixer from '../MobileMapFixer';
import { MapEvents } from '../MapEffectsController';
import { MapEffectsComposerWrapper } from '../MapComponents';

interface MapControllersProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  useMobileMapFixer: boolean;
  isMobile: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onSiqsCalculated: (siqs: number) => void;
}

/**
 * MapControllers - Manages all map controllers and effects
 */
const MapControllers: React.FC<MapControllersProps> = ({
  userLocation,
  activeView,
  searchRadius,
  useMobileMapFixer,
  isMobile,
  onMapClick,
  onSiqsCalculated
}) => {
  const safeUserLocation = userLocation || null;
  
  return (
    <>
      <MapEffectsComposerWrapper
        userLocation={safeUserLocation}
        activeView={activeView}
        searchRadius={searchRadius}
        onSiqsCalculated={onSiqsCalculated}
        // Disable auto-centering behavior
        disableAutoCenter={true}
      />
      
      <MapEvents onMapClick={onMapClick} />
      
      <MapController 
        userLocation={safeUserLocation} 
        searchRadius={searchRadius}
        // Disable auto-zoom behavior
        disableAutoZoom={true} 
      />
      
      {useMobileMapFixer && isMobile && <MobileMapFixer />}
    </>
  );
};

export default MapControllers;
