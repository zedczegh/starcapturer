
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapControllerProps { 
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  disableAutoZoom?: boolean;
  disableAutoCenter?: boolean;
}

export const MapController: React.FC<MapControllerProps> = ({ 
  userLocation,
  searchRadius,
  disableAutoZoom = true,  // Default to disabled auto-zoom
  disableAutoCenter = true // Default to disabled auto-center
}) => {
  const map = useMap();
  const firstRenderRef = useRef(true);
  const isMobile = useIsMobile();
  const initialViewSetRef = useRef(false);
  
  useEffect(() => {
    if (!map) return;
    
    const handleMapInvalidation = () => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.error("Error invalidating map size:", error);
      }
    };
    
    // Run once on initial load to ensure proper sizing
    setTimeout(handleMapInvalidation, 300);
    
    // Apply mobile optimizations
    if (isMobile) {
      map.dragging.enable();
      map.touchZoom.enable();
      
      if (map.dragging._draggable) {
        map.dragging._draggable._inertia = true;
        map.dragging._draggable.options.inertia = {
          deceleration: 2500,
          maxSpeed: 1800,
          timeThreshold: 80,
          linearity: 0.25
        };
      }
      
      map.touchZoom.disable();
      map.touchZoom.enable();
      map.boxZoom.disable();
      
      if (map.options) {
        map.options.touchZoom = 'center';
        map.options.doubleClickZoom = 'center';
        map.options.bounceAtZoomLimits = false;
      }
    } else {
      map.scrollWheelZoom.enable();
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();
    }
    
    // Optimize panes for better performance
    for (const key in map._panes) {
      if (map._panes[key] && map._panes[key].style) {
        map._panes[key].style.willChange = 'transform';
        map._panes[key].style.backfaceVisibility = 'hidden';
      }
    }
    
    // Disable animations that cause flashing
    if (map.options) {
      map.options.zoomAnimation = false;
      map.options.markerZoomAnimation = false;
    }
    
    window.addEventListener('resize', handleMapInvalidation);
    
    // Only set initial view once and only if not disabled
    if (userLocation && firstRenderRef.current && !initialViewSetRef.current && !disableAutoCenter) {
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
      firstRenderRef.current = false;
      initialViewSetRef.current = true;
    }
    
    return () => {
      window.removeEventListener('resize', handleMapInvalidation);
    };
  }, [map, userLocation, isMobile, disableAutoZoom, disableAutoCenter]);

  return null;
};

export default MapController;
