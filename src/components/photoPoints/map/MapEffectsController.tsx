
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapEffectsControllerProps {
  onMapClick: (lat: number, lng: number) => void;
}

// Prevent infinite scrolling beyond world bounds
export const WorldBoundsController: React.FC = () => {
  const map = useMap();
  const initialized = useRef(false);
  
  useEffect(() => {
    if (!map || initialized.current) return;
    initialized.current = true;
    
    // Set max bounds to prevent scrolling beyond the world
    const worldBounds = new L.LatLngBounds(
      new L.LatLng(-85.06, -180), // Southwest corner
      new L.LatLng(85.06, 180)    // Northeast corner
    );
    
    map.setMaxBounds(worldBounds);
    
    const handleDrag = () => {
      map.panInsideBounds(worldBounds, { animate: false });
    };
    
    map.on('drag', handleDrag);
    
    // Ensure better touch handling for mobile Safari
    if (map.dragging && map.dragging.enable) {
      map.dragging.enable();
    }
    
    if (map.touchZoom && map.touchZoom.enable) {
      map.touchZoom.enable();
    }
    
    // Set lower inertia for smoother mobile dragging
    if (map.dragging && map.dragging._draggable) {
      try {
        // Safely set inertia properties
        const draggable = map.dragging._draggable;
        if (draggable._inertia) {
          draggable._inertia.threshold = 20; // Lower value helps with Safari
          draggable._inertia.deceleration = 3000; // Higher value reduces drift
        }
      } catch (error) {
        console.error("Error optimizing map dragging:", error);
      }
    }
    
    return () => {
      map.off('drag', handleDrag);
    };
  }, [map]);
  
  return null;
};

export const MapEvents: React.FC<MapEffectsControllerProps> = ({ onMapClick }) => {
  const map = useMap();
  const clickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);

  // Set up map click event handler with proper cleanup
  useEffect(() => {
    if (!map) return;
    
    // Remove any existing handler to prevent duplicates
    if (clickHandlerRef.current) {
      map.off('click', clickHandlerRef.current);
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    // Store reference to handler for cleanup
    clickHandlerRef.current = handleMapClick;
    map.on('click', handleMapClick);

    return () => {
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current);
      }
    };
  }, [map, onMapClick]);

  return null;
};

export default MapEvents;
