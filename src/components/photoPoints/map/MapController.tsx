
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
 * Enhanced for mobile touch interactions and Safari compatibility
 */
export const MapController: React.FC<MapControllerProps> = ({ 
  userLocation, 
  searchRadius
}) => {
  const map = useMap();
  const firstRenderRef = useRef(true);
  const isMobile = useIsMobile();
  const isSafari = useRef(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  
  useEffect(() => {
    if (!map) return;
    
    // Mobile-specific optimizations
    if (isMobile) {
      // Improve touch handling on mobile devices
      map.dragging.enable();
      map.touchZoom.enable();
      
      // Lower inertia for smoother dragging on mobile
      if (map.dragging._draggable) {
        map.dragging._draggable._inertia = true;
        map.dragging._draggable.options.inertia = {
          deceleration: 3000, // Higher value = faster stop (default: 3000)
          maxSpeed: 1500,     // Lower for smoother movement (default: 1500)
          timeThreshold: 100, // Lower for more responsive dragging (default: 200)
          linearity: 0.25     // Higher = more linear deceleration (default: 0.2)
        };
      }
      
      // Fix pinch-zoom issues by ensuring proper event handling
      map.touchZoom.disable();
      map.touchZoom.enable();
      
      // Prevent multiple finger gestures from triggering unwanted actions
      map.boxZoom.disable();
      
      // Remove tap delay for more responsive interaction
      if (map.tap) {
        map.tap.disable();
        map.tap.enable();
        
        // Force tap handler to be more responsive
        const mapPane = map.getPane('mapPane');
        if (mapPane) {
          mapPane.style.touchAction = "none";
        }
      }
      
      // Safari-specific optimizations
      if (isSafari.current) {
        // Add Safari-specific optimizations for mobile
        try {
          // Improve touch detection
          map.options.tap = true;
          
          // Fix Safari-specific drag issues
          if (map.dragging._draggable) {
            map.dragging._draggable._touchstart = function(e) {
              if (!e.touches || e.touches.length !== 1) { return; }
              const touch = e.touches[0];
              this._startPoint = new L.Point(touch.clientX, touch.clientY);
              this._startPos = this._newPos = L.DomUtil.getPosition(this._element);
              this.fire('down', e);
            };
          }
          
          // Force hardware acceleration for map panes in Safari
          const mapPane = map.getPane('mapPane');
          if (mapPane) {
            mapPane.style.transform = 'translate3d(0,0,0)';
            mapPane.style.webkitTransform = 'translate3d(0,0,0)';
            mapPane.style.backfaceVisibility = 'hidden';
            mapPane.style.webkitBackfaceVisibility = 'hidden';
          }
        } catch (error) {
          console.warn("Safari-specific optimizations failed:", error);
        }
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
    
    // Improve performance by reducing re-renders
    map._onResize = L.Util.throttle(map._onResize, 200, map);
    
    // Store map reference for debugging
    (window as any).leafletMap = map;
    
    // Center map on user location once on first render
    if (userLocation && firstRenderRef.current) {
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
      firstRenderRef.current = false;
    }
    
    // Make sure map renders correctly after component mount in Safari
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.warn("Map invalidateSize failed:", error);
      }
    }, 100);
    
    return () => {
      // Clean up global reference
      delete (window as any).leafletMap;
    };
  }, [map, userLocation, isMobile]);

  return null;
};

export default MapController;
