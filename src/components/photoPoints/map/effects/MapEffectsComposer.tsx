
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { WorldBoundsController } from '../MapEffectsController';
import SiqsEffectsController from './SiqsEffectsController';

interface MapEffectsComposerProps {
  center?: [number, number];
  zoom?: number;
  userLocation?: { latitude: number; longitude: number } | null;
  activeView?: 'certified' | 'calculated';
  searchRadius?: number;
  onSiqsCalculated?: (siqs: number) => void;
}

const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({ 
  center,
  zoom,
  userLocation,
  activeView = 'certified',
  searchRadius = 100,
  onSiqsCalculated
}) => {
  const map = useMap();
  
  // Set view when center changes
  useEffect(() => {
    if (!map || !center) return;
    
    // Use a small delay to prevent race conditions with other map operations
    const timeoutId = setTimeout(() => {
      if (map && map.setView) {
        try {
          map.setView(center, zoom || map.getZoom(), {
            animate: true,
            duration: 0.5 // Faster animation
          });
        } catch (error) {
          console.error("Error setting map view:", error);
        }
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [map, center, zoom]);
  
  return (
    <>
      {/* Apply world bounds limit */}
      <WorldBoundsController />
      
      {/* Apply SIQS-specific effects only when userLocation is available */}
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
