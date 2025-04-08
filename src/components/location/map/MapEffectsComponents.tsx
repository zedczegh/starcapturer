
import React, { useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * Component to update map view when center position changes
 */
export function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    try {
      map.setView(position, map.getZoom(), {
        animate: true,
        duration: 1
      });
    } catch (error) {
      console.error("Error updating map view:", error);
    }
  }, [map, position]);
  
  return null;
}

/**
 * Component to handle map click events for editable maps
 */
export function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    onMapClick(e.latlng.lat, e.latlng.lng);
  }, [onMapClick]);
  
  useEffect(() => {
    if (!map) return;
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, handleMapClick]);
  
  return null;
}

/**
 * Component to apply additional dark sky overlay for certified locations
 */
export function DarkSkyOverlay({ 
  isDarkSkyReserve, 
  position 
}: { 
  isDarkSkyReserve?: boolean; 
  position: [number, number];
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!isDarkSkyReserve || !map) return;
    
    // Create a circular overlay for the dark sky region
    const circle = L.circle(position, {
      radius: 10000, // 10km radius
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);
    
    return () => {
      if (circle) {
        try {
          circle.remove();
        } catch (error) {
          console.error("Error removing circle overlay:", error);
        }
      }
    };
  }, [isDarkSkyReserve, position, map]);
  
  return null;
}

/**
 * Component to handle map interactivity settings
 */
export function MapInteractionManager({
  draggable = true,
  zoomable = true,
  onReady
}: {
  draggable?: boolean;
  zoomable?: boolean;
  onReady?: () => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Set dragging state
    if (draggable) {
      map.dragging.enable();
    } else {
      map.dragging.disable();
    }
    
    // Set zoom state
    if (zoomable) {
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
    }
    
    // Call onReady callback if provided
    if (onReady) {
      onReady();
    }
    
    return () => {
      // Clean up if needed
    };
  }, [map, draggable, zoomable, onReady]);
  
  return null;
}
