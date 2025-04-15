
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapControllerProps { 
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  doubleClickZoom?: boolean; // Add prop to handle double click zoom
}

export const MapController: React.FC<MapControllerProps> = ({ 
  userLocation,
  searchRadius,
  doubleClickZoom = true // Default to true
}) => {
  const map = useMap();
  const firstRenderRef = useRef(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map) return;
    
    const handleMapInvalidation = () => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.error("Error invalidating map size:", error);
      }
    };
    
    setTimeout(handleMapInvalidation, 300);
    
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
        map.options.bounceAtZoomLimits = false;
      }
    } else {
      map.scrollWheelZoom.enable();
      map.dragging.enable();
      map.touchZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();
    }
    
    // Handle double click zoom here instead of in MapContainer props
    if (doubleClickZoom) {
      map.doubleClickZoom.enable();
    } else {
      map.doubleClickZoom.disable();
    }
    
    for (const key in map._panes) {
      if (map._panes[key] && map._panes[key].style) {
        map._panes[key].style.willChange = 'transform';
        map._panes[key].style.backfaceVisibility = 'hidden';
      }
    }
    
    window.addEventListener('resize', handleMapInvalidation);
    
    // Only center map on first render with user location
    if (userLocation && firstRenderRef.current) {
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
      firstRenderRef.current = false;
    }
    
    return () => {
      window.removeEventListener('resize', handleMapInvalidation);
    };
  }, [map, userLocation, isMobile, doubleClickZoom]); // Add doubleClickZoom to dependencies

  return null;
};

export default MapController;
