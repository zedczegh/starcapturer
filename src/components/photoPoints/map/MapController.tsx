
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
 * Enhanced for mobile touch interactions
 */
export const MapController: React.FC<MapControllerProps> = ({ 
  userLocation, 
  searchRadius
}) => {
  const map = useMap();
  const firstRenderRef = useRef(true);
  const isMobile = useIsMobile();
  const setupCompleteRef = useRef(false);
  
  useEffect(() => {
    if (!map || setupCompleteRef.current) return;
    
    // Mobile-specific optimizations
    if (isMobile) {
      // Wait a moment to ensure the map is fully initialized
      setTimeout(() => {
        try {
          // Completely rebuild mobile touch handling
          // First disable all to reset any problematic settings
          if (map.tap) map.tap.disable();
          map.touchZoom.disable();
          map.boxZoom.disable();
          map.doubleClickZoom.disable();
          map.dragging.disable();
          
          // Re-enable with better settings
          map.touchZoom.enable();
          map.dragging.enable();
          map.doubleClickZoom.enable();
          
          // Improve touch handling
          if (map.tap) {
            map.tap.enable();
            
            // Force tap handler to be more responsive
            const mapPane = map.getPane('mapPane');
            if (mapPane) {
              mapPane.style.touchAction = "none";
              mapPane.style.msTouchAction = "none";
            }
          }
          
          // Lower inertia for smoother dragging on mobile
          if (map.dragging._draggable) {
            map.dragging._draggable._inertia = true;
            map.dragging._draggable.options.inertia = {
              deceleration: 2500, // Higher value = faster stop
              maxSpeed: 1800,     // Higher for more responsive feel
              timeThreshold: 80,  // Lower for more responsive dragging
              linearity: 0.25     // Higher = more linear deceleration
            };
          }
          
          // Fix pinch-zoom issues by ensuring proper event handling
          map.touchZoom.disable();
          map.touchZoom.enable();
          
          // Set better zoom settings for mobile
          if (map.options) {
            // @ts-ignore - These properties exist but are not in the type definitions
            map.options.touchZoom = 'center'; // More predictable zooming behavior
            map.options.doubleClickZoom = 'center';
            map.options.bounceAtZoomLimits = false; // Prevent bounce effect at limits
          }
          
          // Add a special handler to fix marker positioning on zoom
          map.on('zoomanim', function() {
            if (map._panes && map._panes.markerPane) {
              // Force repaint with hardware acceleration to fix marker positions
              requestAnimationFrame(() => {
                map._panes.markerPane.style.transform = 'translate3d(0,0,0)';
              });
            }
          });
          
          // Fix for iOS Safari touch handling
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          if (isIOS) {
            // Prevent page scrolling when interacting with map
            const preventScroll = (e: TouchEvent) => {
              if (e.touches.length <= 2) { // Allow two finger gestures for zoom
                e.preventDefault();
              }
            };
            
            // Add with passive: false to ensure preventDefault works
            map.getContainer().addEventListener('touchstart', preventScroll, { passive: false });
            
            // Return cleanup function for iOS-specific handlers
            return () => {
              map.getContainer().removeEventListener('touchstart', preventScroll);
            };
          }
        } catch (err) {
          console.error("Error setting up mobile map:", err);
        }
      }, 300); // Give time for map to fully initialize
      
      // Prevent scrolling the page when trying to zoom/pan the map
      map.getContainer().style.touchAction = "none";
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
    
    // Improve performance by reducing re-renders
    map._onResize = L.Util.throttle(map._onResize, 100, map);
    
    // Store map reference for debugging
    (window as any).leafletMap = map;
    
    // Mark setup as complete to prevent duplicate configuration
    setupCompleteRef.current = true;
    
    // Center map on user location once on first render
    if (userLocation && firstRenderRef.current) {
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
      firstRenderRef.current = false;
    }
    
    return () => {
      // Clean up event listeners
      map.off('zoomanim');
      
      // Clean up global reference
      delete (window as any).leafletMap;
    };
  }, [map, userLocation, isMobile]);

  return null;
};

export default MapController;
