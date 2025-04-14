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
  const [lastUserLocation, setLastUserLocation] = React.useState(userLocation);
  const locationChangedRef = React.useRef(false);
  
  // Only update center position, keep current zoom level
  React.useEffect(() => {
    if (!map || !center) return;
    
    // Only set the center, not the zoom level
    map.setView(center, map.getZoom());
  }, [map, center]);
  
  // Track user location changes
  React.useEffect(() => {
    if (!userLocation || !lastUserLocation) {
      setLastUserLocation(userLocation);
      return;
    }
    
    // Check if location has changed significantly
    if (
      Math.abs(userLocation.latitude - lastUserLocation.latitude) > 0.0001 || 
      Math.abs(userLocation.longitude - lastUserLocation.longitude) > 0.0001
    ) {
      locationChangedRef.current = true;
      // Set a timeout to reset the flag
      const timeout = window.setTimeout(() => {
        locationChangedRef.current = false;
      }, 1000); // Reset flag after 1 second
      
      // Update last location
      setLastUserLocation(userLocation);
      
      return () => {
        window.clearTimeout(timeout);
      };
    }
  }, [userLocation, lastUserLocation]);
  
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
          locationChanged={locationChangedRef.current}
        />
      )}
    </>
  );
};

export default MapEffectsComposer;
