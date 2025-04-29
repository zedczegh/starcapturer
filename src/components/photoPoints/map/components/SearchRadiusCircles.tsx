
import React from 'react';
import { Circle } from 'react-leaflet';

interface SearchRadiusCirclesProps {
  center: [number, number];
  radius: number;
}

const SearchRadiusCircles: React.FC<SearchRadiusCirclesProps> = ({ center, radius }) => {
  // Convert radius from km to meters
  const radiusInMeters = radius * 1000;
  
  return (
    <>
      {/* Main radius circle */}
      <Circle
        center={center}
        radius={radiusInMeters}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f680',
          fillOpacity: 0.1,
          weight: 1,
          dashArray: '5, 5'
        }}
      />
      
      {/* Inner radius circle at 50% */}
      <Circle
        center={center}
        radius={radiusInMeters * 0.5}
        pathOptions={{
          color: '#3b82f6',
          fillOpacity: 0,
          weight: 1,
          dashArray: '3, 7',
          opacity: 0.5
        }}
      />
    </>
  );
};

export default SearchRadiusCircles;
