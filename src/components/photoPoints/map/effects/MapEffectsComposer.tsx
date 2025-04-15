
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
 * IMPORTANT: This component must never conditionally render components that use hooks
 */
const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({ 
  userLocation,
  activeView = 'certified',
  searchRadius = 100,
  onSiqsCalculated
}) => {
  // Always call useMap hook first before any conditional logic
  const map = useMap();
  
  return (
    <>
      {/* Apply world bounds limit */}
      <WorldBoundsController />
      
      {/* 
        Always render SiqsEffectsController, but pass disabled prop 
        when necessary to prevent internal calculations
      */}
      <SiqsEffectsController 
        userLocation={userLocation || null}
        activeView={activeView}
        searchRadius={searchRadius}
        onSiqsCalculated={onSiqsCalculated}
        disabled={!userLocation}
      />
    </>
  );
};

export default MapEffectsComposer;
