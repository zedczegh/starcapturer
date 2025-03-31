
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
    // Create circle on component mount
    circleRef.current = L.circle(center, {
      radius,
      color,
      fillColor,
      weight,
      opacity,
      fillOpacity
    }).addTo(map);

    // Cleanup on unmount
    return () => {
      if (circleRef.current) {
        circleRef.current.remove();
      }
    };
  }, [center, radius, color, fillColor, weight, opacity, fillOpacity, map]);

  // This component doesn't render anything directly,
  // it just attaches and manages the Leaflet circle
  return null;
};

export default MapCircle;
