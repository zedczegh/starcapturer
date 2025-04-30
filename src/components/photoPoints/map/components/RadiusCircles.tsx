
import React from 'react';
import { Circle } from 'react-leaflet';
import L from 'leaflet';

interface RadiusCirclesProps {
  center: [number, number];
  searchRadius: number;
}

const RadiusCircles: React.FC<RadiusCirclesProps> = ({ center, searchRadius }) => {
  // Create color based on search radius
  const getCircleColor = (radius: number): string => {
    if (radius <= 100) return 'rgba(59, 130, 246, 0.3)'; // Blue
    if (radius <= 300) return 'rgba(16, 185, 129, 0.3)'; // Green
    if (radius <= 500) return 'rgba(245, 158, 11, 0.3)'; // Yellow
    return 'rgba(239, 68, 68, 0.3)'; // Red
  };
  
  const color = getCircleColor(searchRadius);
  const radiusInMeters = searchRadius * 1000; // Convert km to meters
  
  return (
    <Circle
      center={center}
      radius={radiusInMeters}
      pathOptions={{ 
        color, 
        weight: 1,
        fillOpacity: 0.1
      }}
    />
  );
};

export default RadiusCircles;
export { RadiusCircles };
