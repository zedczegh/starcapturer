
import React, { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapComponentProps {
  onMapClick?: (lat: number, lng: number) => void;
  onMapMove?: (lat: number, lng: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onMapClick, onMapMove }) => {
  const map = useMap();
  const eventHandlersRef = useRef({
    click: null as ((e: L.LeafletMouseEvent) => void) | null,
    moveend: null as (() => void) | null
  });
  const isMapMountedRef = useRef(false);

  // Handle map click events
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (onMapClick) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  }, [onMapClick]);

  // Handle map move events
  const handleMapMove = useCallback(() => {
    if (onMapMove && map) {
      const center = map.getCenter();
      onMapMove(center.lat, center.lng);
    }
  }, [map, onMapMove]);

  // Set up event listeners
  useEffect(() => {
    if (!map || !isMapMountedRef.current) return;
    
    // Store current handlers for cleanup
    eventHandlersRef.current.click = onMapClick ? handleMapClick : null;
    eventHandlersRef.current.moveend = onMapMove ? handleMapMove : null;
    
    // Add event listeners
    if (onMapClick) {
      map.on('click', handleMapClick);
    }
    
    if (onMapMove) {
      map.on('moveend', handleMapMove);
    }

    // Safely invalidate map size after a delay to ensure the container is fully rendered
    const timer = setTimeout(() => {
      if (map && isMapMountedRef.current) {
        try {
          map.invalidateSize({
            animate: false,
            pan: false
          });
        } catch (error) {
          console.error("Error invalidating map size:", error);
        }
      }
    }, 250);

    return () => {
      // Clear timeout
      clearTimeout(timer);
      
      // Only remove listeners if map still exists
      if (map && isMapMountedRef.current) {
        // Remove event listeners using the stored handlers
        if (eventHandlersRef.current.click) {
          map.off('click', eventHandlersRef.current.click);
        }
        
        if (eventHandlersRef.current.moveend) {
          map.off('moveend', eventHandlersRef.current.moveend);
        }
      }
      
      // Clear handlers
      eventHandlersRef.current.click = null;
      eventHandlersRef.current.moveend = null;
    };
  }, [map, handleMapClick, handleMapMove, onMapClick, onMapMove]);

  // Track map mounted state
  useEffect(() => {
    isMapMountedRef.current = true;
    
    return () => {
      isMapMountedRef.current = false;
    };
  }, []);

  return null;
};

export default MapComponent;
