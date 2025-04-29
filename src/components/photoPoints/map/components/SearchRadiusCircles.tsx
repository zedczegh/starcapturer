
import React from 'react';
import { Circle } from 'react-leaflet';

interface SearchRadiusCirclesProps {
  center: [number, number];
  radius: number;
}

const SearchRadiusCircles: React.FC<SearchRadiusCirclesProps> = ({ center, radius }) => {
  // Convert radius from km to meters for Leaflet
  const radiusInMeters = radius * 1000;
  
  return (
    <Circle
      center={center}
      radius={radiusInMeters}
      pathOptions={{
        color: 'rgba(59, 130, 246, 0.5)',
        fillColor: 'rgba(59, 130, 246, 0.1)',
        weight: 1,
      }}
    />
  );
};

export default SearchRadiusCircles;
