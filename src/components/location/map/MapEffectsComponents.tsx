
import React, { useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useIsMobile } from "@/hooks/use-mobile";

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
 * Enhanced for better mobile touch handling
 */
export function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  const isMobile = useIsMobile();
  
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    onMapClick(e.latlng.lat, e.latlng.lng);
  }, [onMapClick]);
  
  useEffect(() => {
    if (!map) return;
    
    let clickTimeout: number | null = null;
    let isDragging = false;
    
    // Handle standard click events
    map.on('click', handleMapClick);
    
    // Enhanced mobile-specific handling
    if (isMobile) {
      // Track drag state to prevent click events during drag
      map.on('dragstart', () => {
        isDragging = true;
        if (clickTimeout !== null) {
          window.clearTimeout(clickTimeout);
          clickTimeout = null;
        }
      });
      
      map.on('dragend', () => {
        // Add small delay before allowing clicks again
        setTimeout(() => {
          isDragging = false;
        }, 50);
      });
      
      // Replace standard click with a custom handler for mobile
      map.off('click', handleMapClick);
      
      // Use a tap handler with better precision for mobile
      map.on('tap', (e: any) => {
        if (isDragging) return;
        
        // Slight delay to ensure it's not part of a drag
        if (clickTimeout !== null) {
          window.clearTimeout(clickTimeout);
        }
        
        clickTimeout = window.setTimeout(() => {
          handleMapClick(e);
        }, 50);
      });
    }
    
    return () => {
      map.off('click', handleMapClick);
      if (isMobile) {
        map.off('tap');
        map.off('dragstart');
        map.off('dragend');
      }
      if (clickTimeout !== null) {
        window.clearTimeout(clickTimeout);
      }
    };
  }, [map, handleMapClick, isMobile]);
  
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
 * Enhanced for mobile devices
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
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map) return;
    
    // Set dragging state with mobile optimizations
    if (draggable) {
      map.dragging.enable();
      
      // Apply mobile-specific dragging settings
      if (isMobile && map.dragging._draggable) {
        // Improve mobile dragging by adjusting inertia settings
        map.dragging._draggable._inertia = true;
        map.dragging._draggable.options.inertia = {
          deceleration: 3000,
          maxSpeed: 1500,
          timeThreshold: 100,
          linearity: 0.25
        };
      }
    } else {
      map.dragging.disable();
    }
    
    // Set zoom state with mobile optimizations
    if (zoomable) {
      if (isMobile) {
        // Ensure touch zoom is properly configured
        map.touchZoom.disable();
        map.touchZoom.enable();
        map.doubleClickZoom.disable(); // Disable to prevent accidental zooms
      } else {
        map.scrollWheelZoom.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
      }
    } else {
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
    }
    
    // Improve map panning performance
    if (map._mapPane) {
      map._mapPane.style.willChange = 'transform';
    }
    
    // Call onReady callback if provided
    if (onReady) {
      onReady();
    }
    
    return () => {
      // Clean up if needed
      if (map._mapPane) {
        map._mapPane.style.willChange = 'auto';
      }
    };
  }, [map, draggable, zoomable, onReady, isMobile]);
  
  return null;
}
