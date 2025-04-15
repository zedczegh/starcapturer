
import React from 'react';
import { Circle } from 'react-leaflet';

interface MapSearchRadiusProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  showRadius: boolean;
}

const MapSearchRadius: React.FC<MapSearchRadiusProps> = ({ 
  userLocation, 
  searchRadius,
  showRadius 
}) => {
  if (!showRadius || !userLocation) return null;
  
  return (
    <Circle
      center={[userLocation.latitude, userLocation.longitude]}
      pathOptions={{
        color: 'rgb(99, 102, 241)',
        fillColor: 'rgb(99, 102, 241)',
        fillOpacity: 0.05,
        weight: 1,
        dashArray: '5, 5',
      }}
      radius={searchRadius * 1000}
    />
  );
};

export default MapSearchRadius;
