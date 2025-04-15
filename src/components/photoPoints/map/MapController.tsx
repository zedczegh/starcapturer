
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
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
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map) return;
    
    // Basic map setup without auto-behaviors
    const handleMapInvalidation = () => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.error("Error invalidating map size:", error);
      }
    };
    
    // Initial size check
    setTimeout(handleMapInvalidation, 300);
    
    // Mobile optimizations
    if (isMobile) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.boxZoom.disable();
      
      if (map.options) {
        map.options.touchZoom = 'center';
        map.options.doubleClickZoom = 'center';
        map.options.bounceAtZoomLimits = false;
      }
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();
    }
    
    // Basic performance optimizations
    for (const key in map._panes) {
      if (map._panes[key] && map._panes[key].style) {
        map._panes[key].style.willChange = 'transform';
        map._panes[key].style.backfaceVisibility = 'hidden';
      }
    }
    
    // Handle resize
    window.addEventListener('resize', handleMapInvalidation);
    
    return () => {
      window.removeEventListener('resize', handleMapInvalidation);
    };
  }, [map, isMobile]);

  return null;
};

export default MapController;
