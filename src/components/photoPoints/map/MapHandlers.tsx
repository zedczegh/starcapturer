
import React, { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface MapResizeHandlerProps {
  mapRef: React.MutableRefObject<any>;
}

/**
 * Component to handle map resize events
 */
export const MapResizeHandler: React.FC<MapResizeHandlerProps> = ({ mapRef }) => {
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    const handleResize = () => {
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapRef.current]);

  return null;
};

interface SiqsDetectorProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  onSiqsDetected: (siqs: number | null) => void;
}

/**
 * Component to detect SIQS values from nearby locations
 */
export const SiqsDetector: React.FC<SiqsDetectorProps> = ({ 
  userLocation, 
  locations, 
  onSiqsDetected 
}) => {
  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      
      // Find if user location matches any spot location
      const sameLocation = locations.find(loc => 
        Math.abs(loc.latitude - userLat) < 0.0001 && 
        Math.abs(loc.longitude - userLng) < 0.0001
      );
      
      if (sameLocation && sameLocation.siqs) {
        onSiqsDetected(sameLocation.siqs);
      } else {
        onSiqsDetected(null);
      }
    }
  }, [userLocation, locations, onSiqsDetected]);

  return null;
};

interface MapControlsProps {
  onMapReady?: () => void;
}

/**
 * Component to handle map initialization and exposure to window for debugging
 */
export const MapInitializer: React.FC<MapControlsProps> = ({ onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      (window as any).leafletMap = map;
      
      if (onMapReady) {
        onMapReady();
      }
    }
  }, [map, onMapReady]);

  return null;
};
