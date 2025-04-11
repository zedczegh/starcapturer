
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { WorldBoundsController } from './MapComponents';

interface MapControllerProps { 
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
}

/**
 * Component to handle map events and interactions
 */
export const MapController: React.FC<MapControllerProps> = ({ 
  userLocation, 
  searchRadius
}) => {
  const map = useMap();
  const firstRenderRef = useRef(true);
  
  useEffect(() => {
    if (!map) return;
    
    // Always enable all controls to allow dragging and interaction
    map.scrollWheelZoom.enable();
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (map.tap) map.tap.enable();
    
    // Explicitly check and log if dragging is enabled
    console.log("Map dragging enabled:", map.dragging.enabled());
    
    // Store map reference in window for external access
    (window as any).leafletMap = map;
    
    // If user location exists, center on it
    if (userLocation && firstRenderRef.current) {
      // Only set view once on first render to avoid constant recentering
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
      firstRenderRef.current = false;
    }

    // Improve performance by reduced rerenders on pan/zoom
    map._onResize = L.Util.throttle(map._onResize, 200, map);
    
    return () => {
      // Clean up if needed
      delete (window as any).leafletMap;
    };
  }, [map, userLocation]);

  return <WorldBoundsController />;
};

export default MapController;
