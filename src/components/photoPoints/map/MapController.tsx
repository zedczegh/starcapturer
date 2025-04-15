
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
        // Check if the DOM element is ready before invalidating
        if (map && map.getContainer() && map.getContainer().clientHeight > 0) {
          map.invalidateSize();
        } else {
          // If the container is not ready, try again later
          setTimeout(handleMapInvalidation, 200);
        }
      } catch (error) {
        console.error("Error invalidating map size:", error);
      }
    };
    
    // Initial size check with safe delay for DOM to be ready
    setTimeout(handleMapInvalidation, 300);
    
    // Mobile optimizations
    if (isMobile) {
      try {
        map.dragging.enable();
        map.touchZoom.enable();
        map.boxZoom.disable();
        
        if (map.options) {
          map.options.touchZoom = 'center';
          map.options.doubleClickZoom = 'center';
          map.options.bounceAtZoomLimits = false;
        }
      } catch (error) {
        console.error("Error setting mobile map options:", error);
      }
    } else {
      try {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        if (map.tap) map.tap.enable();
      } catch (error) {
        console.error("Error setting desktop map options:", error);
      }
    }
    
    // Basic performance optimizations
    try {
      for (const key in map._panes) {
        if (map._panes[key] && map._panes[key].style) {
          map._panes[key].style.willChange = 'transform';
          map._panes[key].style.backfaceVisibility = 'hidden';
        }
      }
    } catch (error) {
      console.error("Error setting map pane optimizations:", error);
    }
    
    // Handle resize with error handling
    const safeHandleResize = () => {
      try {
        handleMapInvalidation();
      } catch (error) {
        console.error("Error handling map resize:", error);
      }
    };
    
    window.addEventListener('resize', safeHandleResize);
    
    return () => {
      window.removeEventListener('resize', safeHandleResize);
    };
  }, [map, isMobile]);

  return null;
};

export default MapController;
