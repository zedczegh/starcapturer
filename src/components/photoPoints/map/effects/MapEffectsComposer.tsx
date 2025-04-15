
import React from 'react';
import { useMap } from 'react-leaflet';
import { WorldBoundsController } from '../MapEffectsController';

interface MapEffectsComposerProps {
  userLocation?: { latitude: number; longitude: number } | null;
  activeView?: 'certified' | 'calculated';
  searchRadius?: number;
  onSiqsCalculated?: (siqs: number) => void;
}

/**
 * Simplified map effects composer with reduced visual effects for better mobile performance
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
      {/* Apply world bounds limit only - removed other effects */}
      <WorldBoundsController />
    </>
  );
};

export default MapEffectsComposer;
