
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
  
  // This effect creates and manages the circle on the map
  useEffect(() => {
    // Only proceed if the map is available
    if (!map) return;
    
    // Remove any existing circle to prevent duplicates
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
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
    
    // Clean up on unmount or before recreation
    return () => {
      if (circleRef.current) {
        try {
          circleRef.current.remove();
          circleRef.current = null;
        } catch (error) {
          console.error("Error removing circle:", error);
        }
      }
    };
  }, [map, center, radius, color, fillColor, weight, opacity, fillOpacity]);

  return null;
};

export default MapCircle;
