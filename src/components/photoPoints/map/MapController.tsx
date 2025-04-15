
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapControllerProps { 
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
}

export const MapController: React.FC<MapControllerProps> = ({ 
  userLocation, 
  searchRadius
}) => {
  const map = useMap();
  const firstRenderRef = useRef(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map) return;
    
    // Mobile-specific optimizations
    if (isMobile) {
      // Force enable dragging and touch handlers
      map.dragging.enable();
      map.touchZoom.enable();
      
      // Fix for Safari - Use proper conditional instead of optional chaining in assignment
      if (map.dragging._draggable && !map.dragging._draggable._onUp) {
        map.dragging._draggable._onUp = () => {};
      }
      
      // Lower inertia for smoother dragging on mobile
      if (map.dragging._draggable) {
        map.dragging._draggable._inertia = true;
        map.dragging._draggable.options.inertia = {
          deceleration: 3000,
          maxSpeed: 1500,
          timeThreshold: 100,
          linearity: 0.25
        };
      }
      
      // Fix pinch-zoom issues
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
      
      // Add Safari specific touch handlers
      const container = map.getContainer();
      container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          map.dragging.enable();
        }
      }, { passive: false });
      
      container.addEventListener('touchend', () => {
        setTimeout(() => {
          map.dragging.enable();
        }, 100);
      });
    } else {
      // Desktop settings
      map.scrollWheelZoom.enable();
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();
    }
    
    // Center map on user location once on first render
    if (userLocation && firstRenderRef.current) {
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
      firstRenderRef.current = false;
    }
    
    return () => {
      const container = map.getContainer();
      container.removeEventListener('touchstart', () => {});
      container.removeEventListener('touchend', () => {});
    };
  }, [map, userLocation, isMobile]);

  return null;
};

export default MapController;
