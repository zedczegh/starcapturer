
import React from 'react';
import { Circle } from 'react-leaflet';

interface SearchRadiusCirclesProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  isForecastMode: boolean;
}

const SearchRadiusCircles: React.FC<SearchRadiusCirclesProps> = ({
  userLocation,
  searchRadius,
  activeView,
  isForecastMode,
}) => {
  if (!userLocation) return null;

  const getCircleOptions = () => {
    const baseOptions = {
      weight: 1,
      fillOpacity: 0.05,
    };
    
    if (isForecastMode) {
      return {
        ...baseOptions,
        color: '#8B5CF6', // Purple for forecast mode
        fillColor: '#C4B5FD',
      };
    }
    
    if (activeView === 'certified') {
      return {
        ...baseOptions,
        color: '#3B82F6', // Blue for certified view
        fillColor: '#93C5FD',
      };
    }
    
    return {
      ...baseOptions,
      color: '#2563EB',
      fillColor: '#93C5FD',
    };
  };

  return (
    <Circle
      center={[userLocation.latitude, userLocation.longitude]}
      radius={searchRadius * 1000} // Convert km to meters
      pathOptions={getCircleOptions()}
    />
  );
};

export default SearchRadiusCircles;
