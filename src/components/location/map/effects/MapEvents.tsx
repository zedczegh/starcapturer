
import React, { useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * Component to handle map click events for editable maps
 */
export function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    onMapClick(e.latlng.lat, e.latlng.lng);
  }, [onMapClick]);
  
  useEffect(() => {
    if (!map) return;
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, handleMapClick]);
  
  return null;
}
