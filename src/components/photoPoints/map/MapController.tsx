
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapControllerProps { 
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
}

/**
 * Component to handle map setup and controls
 * Focused specifically on map initialization and control management
 */
export const MapController: React.FC<MapControllerProps> = ({ 
  userLocation, 
  searchRadius
}) => {
  const map = useMap();
  const firstRenderRef = useRef(true);
  
  useEffect(() => {
    if (!map) return;
    
    // Enable all controls for better map interaction
    map.scrollWheelZoom.enable();
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (map.tap) map.tap.enable();
    
    // Log dragging status for debugging
    console.log("Map dragging enabled:", map.dragging.enabled());
    
    // Store map reference globally for external access
    (window as any).leafletMap = map;
    
    // Center map on user location once on first render
    if (userLocation && firstRenderRef.current) {
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
      firstRenderRef.current = false;
    }

    // Improve performance by reducing re-renders
    map._onResize = L.Util.throttle(map._onResize, 200, map);
    
    return () => {
      // Clean up global reference
      delete (window as any).leafletMap;
    };
  }, [map, userLocation]);

  return null;
};

export default MapController;
