
import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * Component to apply additional dark sky overlay for certified locations
 */
export function DarkSkyOverlay({ 
  isDarkSkyReserve, 
  position 
}: { 
  isDarkSkyReserve?: boolean; 
  position: [number, number];
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!isDarkSkyReserve || !map) return;
    
    // Create a circular overlay for the dark sky region
    const circle = L.circle(position, {
      radius: 10000, // 10km radius
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);
    
    return () => {
      if (circle) {
        try {
          circle.remove();
        } catch (error) {
          console.error("Error removing circle overlay:", error);
        }
      }
    };
  }, [isDarkSkyReserve, position, map]);
  
  return null;
}
