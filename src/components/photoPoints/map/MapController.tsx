
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
    
    // Apply device-specific settings without zoom behaviors
    map.dragging.enable();
    
    if (isMobile) {
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      if (map.tap) map.tap.enable();
    } else {
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();
    }
    
    // Handle invalidation for size issues
    const handleMapInvalidation = () => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.error("Error invalidating map size:", error);
      }
    };
    
    setTimeout(handleMapInvalidation, 300);
    window.addEventListener('resize', handleMapInvalidation);
    
    return () => {
      window.removeEventListener('resize', handleMapInvalidation);
    };
  }, [map, isMobile]);

  return null;
};

export default MapController;
