
import React, { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Component to manage map bounds - simplified for better mobile performance
 */
export function WorldBoundsController() {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Set max bounds with padding to prevent users from panning too far
    const southWest = L.latLng(-85, -180);
    const northEast = L.latLng(85, 180);
    const bounds = L.latLngBounds(southWest, northEast);
    
    // Set bounds with some padding
    map.setMaxBounds(bounds);
    
    // Set minimum zoom level to prevent zooming out too far
    map.setMinZoom(2);
    
    // Disable animations for better mobile performance
    map.options.zoomAnimation = false;
    
    // Improve scroll sensitivity
    if (map.scrollWheelZoom) {
      // @ts-ignore - Internal Leaflet property
      map.scrollWheelZoom.options.wheelDebounceTime = 100;
    }
    
    return () => {
      try {
        map.setMaxBounds(undefined);
      } catch (e) {
        // Ignore errors when cleaning up
      }
    };
  }, [map]);
  
  return null;
}

/**
 * Component to handle map click events - simplified for better performance
 */
export function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleMapClick = (e: any) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

// Export the necessary symbol for TypeScript
export const L = window.L;
