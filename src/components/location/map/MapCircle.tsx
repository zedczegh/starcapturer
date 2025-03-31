
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

interface MapCircleProps {
  center: [number, number];
  radius: number;
  color: string;
  fillColor: string;
  weight?: number;
  opacity?: number;
  fillOpacity?: number;
}

const MapCircle: React.FC<MapCircleProps> = ({
  center,
  radius,
  color,
  fillColor,
  weight = 2,
  opacity = 0.7,
  fillOpacity = 0.3
}) => {
  const circleRef = useRef<L.Circle | null>(null);
  const map = useMap();
  const isMountedRef = useRef<boolean>(true);
  
  // This effect creates and manages the circle on the map
  useEffect(() => {
    // Set mounted flag to true
    isMountedRef.current = true;
    
    // Only proceed if the map is available
    if (!map) return;
    
    // Remove any existing circle to prevent duplicates
    if (circleRef.current) {
      try {
        circleRef.current.remove();
      } catch (error) {
        console.error("Error removing existing circle:", error);
      }
      circleRef.current = null;
    }
    
    // Create a new circle with delay to ensure map is ready
    const timer = setTimeout(() => {
      if (!isMountedRef.current || !map) return;
      
      try {
        // Check if map container still exists to prevent errors
        if (!map.getContainer()) {
          console.log("Map container not found, skipping circle creation");
          return;
        }
        
        // Create a new circle with the provided props
        circleRef.current = L.circle(center, {
          radius,
          color,
          fillColor,
          weight,
          opacity,
          fillOpacity
        }).addTo(map);
      } catch (error) {
        console.error("Error creating circle:", error);
      }
    }, 100);
    
    // Clean up on unmount or before recreation
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      if (circleRef.current) {
        try {
          // Only attempt to remove if we have a valid reference and the map still exists
          if (map && map.getContainer()) {
            circleRef.current.remove();
          }
        } catch (error) {
          console.error("Error removing circle on cleanup:", error);
        }
        circleRef.current = null;
      }
    };
  }, [map, center, radius, color, fillColor, weight, opacity, fillOpacity]);

  return null;
};

export default MapCircle;
