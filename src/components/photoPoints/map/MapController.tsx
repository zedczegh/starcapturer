
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
      map.dragging.enable();
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
    
    // Listen for resize events
    window.addEventListener('resize', handleMapInvalidation);
    
    return () => {
      window.removeEventListener('resize', handleMapInvalidation);
    };
  }, [map, isMobile]);

  return null;
};

export default MapController;
