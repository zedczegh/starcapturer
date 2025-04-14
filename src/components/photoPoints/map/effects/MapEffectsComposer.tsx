
import React, { useEffect, useRef, useState } from 'react';
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
  const [lastUserLocation, setLastUserLocation] = useState(userLocation);
  const locationChangedRef = useRef(false);
  
  // Only update center position, keep current zoom level
  useEffect(() => {
    // Always initialize effect, but conditionally execute the map operation
    if (map && center) {
      // Only set the center, not the zoom level
      map.setView(center, map.getZoom());
    }
  }, [map, center]);
  
  // Track user location changes - ensure this runs consistently
  useEffect(() => {
    // Always initialize timeout ref, even if conditions aren't met
    let timeout: ReturnType<typeof setTimeout> | undefined;
    
    if (userLocation && lastUserLocation) {
      // Check if location has changed significantly
      if (
        Math.abs(userLocation.latitude - lastUserLocation.latitude) > 0.0001 || 
        Math.abs(userLocation.longitude - lastUserLocation.longitude) > 0.0001
      ) {
        locationChangedRef.current = true;
        // Set a timeout to reset the flag
        timeout = setTimeout(() => {
          locationChangedRef.current = false;
        }, 1000); // Reset flag after 1 second
        
        // Update last location
        setLastUserLocation(userLocation);
      }
    } else {
      // Update last location even if one of them is null
      setLastUserLocation(userLocation);
    }
    
    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
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
      
      {/* Radar sweep animation - only render when needed */}
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
