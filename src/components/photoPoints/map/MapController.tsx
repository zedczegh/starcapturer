
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapControllerProps { 
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
}

/**
 * Component to handle map setup and controls
 * Enhanced for mobile touch interactions and proper map size handling
 */
export const MapController: React.FC<MapControllerProps> = ({ 
  userLocation, 
  searchRadius
}) => {
  const map = useMap();
  const firstRenderRef = useRef(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map) return;
    
    // Fix for "_leaflet_pos" error - ensure map is properly sized
    const handleMapInvalidation = () => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.error("Error invalidating map size:", error);
      }
    };
    
    // Wait for the DOM to be fully rendered
    setTimeout(handleMapInvalidation, 300);
    
    // Mobile-specific optimizations
    if (isMobile) {
      // Improve touch handling on mobile devices
      map.dragging.enable();
      map.touchZoom.enable();
      
      // Lower inertia for smoother dragging on mobile
      if (map.dragging._draggable) {
        map.dragging._draggable._inertia = true;
        map.dragging._draggable.options.inertia = {
          deceleration: 2500, // Higher value = faster stop (default: 3000)
          maxSpeed: 1800,     // Higher for more responsive feel (was 1500)
          timeThreshold: 80, // Lower for more responsive dragging (was 100)
          linearity: 0.25     // Higher = more linear deceleration (default: 0.2)
        };
      }
      
      // Fix pinch-zoom issues by ensuring proper event handling
      map.touchZoom.disable();
      map.touchZoom.enable();
      
      // Prevent multiple finger gestures from triggering unwanted actions
      map.boxZoom.disable();
      
      // Set better zoom settings for mobile
      if (map.options) {
        map.options.touchZoom = 'center'; // More predictable zooming behavior
        map.options.doubleClickZoom = 'center';
        map.options.bounceAtZoomLimits = false; // Prevent bounce effect at limits
      }
    } else {
      // Desktop settings - enable all controls
      map.scrollWheelZoom.enable();
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();
    }
    
    // Apply GPU acceleration to all panes for better performance
    for (const key in map._panes) {
      if (map._panes[key] && map._panes[key].style) {
        map._panes[key].style.willChange = 'transform';
        map._panes[key].style.backfaceVisibility = 'hidden';
      }
    }
    
    // Listen for resize events to ensure map size is always correct
    window.addEventListener('resize', handleMapInvalidation);
    
    // Center map on user location once on first render
    if (userLocation && firstRenderRef.current) {
      try {
        map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
        firstRenderRef.current = false;
      } catch (error) {
        console.error("Error setting map view:", error);
      }
    }
    
    return () => {
      window.removeEventListener('resize', handleMapInvalidation);
    };
  }, [map, userLocation, isMobile]);

  return null;
};

export default MapController;
