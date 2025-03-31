
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
  const isMountedRef = useRef(true);

  // Handle map click events
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (onMapClick && isMountedRef.current) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  }, [onMapClick]);

  // Handle map move events
  const handleMapMove = useCallback(() => {
    if (onMapMove && map && isMountedRef.current) {
      const center = map.getCenter();
      onMapMove(center.lat, center.lng);
    }
  }, [map, onMapMove]);

  // Set up event listeners
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!map) return;
    
    // Dispatch event to notify parent components that map is initialized
    try {
      if (map.getContainer()) {
        const event = new CustomEvent('map-initialized');
        map.getContainer().dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error dispatching map-initialized event:", error);
    }
    
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
    
    // Safe invalidate size with check if map is still valid
    const timer = setTimeout(() => {
      try {
        if (map && isMountedRef.current && map.getContainer()) {
          map.invalidateSize({
            animate: false,
            pan: false
          });
        }
      } catch (error) {
        console.error("Error invalidating map size:", error);
      }
    }, 250);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      
      try {
        // Only remove listeners if map still exists
        if (map && map.getContainer()) {
          // Remove event listeners using the stored handlers
          if (eventHandlersRef.current.click) {
            map.off('click', eventHandlersRef.current.click);
          }
          
          if (eventHandlersRef.current.moveend) {
            map.off('moveend', eventHandlersRef.current.moveend);
          }
        }
      } catch (error) {
        console.error("Error cleaning up map event listeners:", error);
      }
      
      // Clear handlers
      eventHandlersRef.current.click = null;
      eventHandlersRef.current.moveend = null;
    };
  }, [map, handleMapClick, handleMapMove, onMapClick, onMapMove]);

  return null;
};

export default MapComponent;
