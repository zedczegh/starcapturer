
import React, { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Component to update map view when center position changes
 */
export function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    try {
      map.setView(position, map.getZoom(), {
        animate: true,
        duration: 1
      });
    } catch (error) {
      console.error("Error updating map view:", error);
    }
  }, [map, position]);
  
  return null;
}
