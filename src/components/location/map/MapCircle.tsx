
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

  useEffect(() => {
    // Only create circle if it doesn't exist or properties have changed
    const shouldRecreate = !circleRef.current || 
      circleRef.current.getLatLng().lat !== center[0] || 
      circleRef.current.getLatLng().lng !== center[1] || 
      circleRef.current.getRadius() !== radius;
    
    if (shouldRecreate) {
      // Remove existing circle if it exists
      if (circleRef.current) {
        circleRef.current.remove();
      }
      
      // Create new circle and add it to the map
      circleRef.current = L.circle(center, {
        radius,
        color,
        fillColor,
        weight,
        opacity,
        fillOpacity
      }).addTo(map);
    }

    // Cleanup on unmount or before recreation
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
  }, [center, radius, color, fillColor, weight, opacity, fillOpacity, map]);

  return null;
};

export default MapCircle;
