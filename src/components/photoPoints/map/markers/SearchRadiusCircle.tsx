
import React from 'react';
import { Circle } from 'react-leaflet';

interface SearchRadiusCircleProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  isCertifiedView: boolean;
}

const SearchRadiusCircle: React.FC<SearchRadiusCircleProps> = ({
  userLocation,
  searchRadius,
  isCertifiedView
}) => {
  if (!userLocation || 
      !searchRadius || 
      searchRadius >= 1000 ||
      typeof userLocation.latitude !== 'number' ||
      typeof userLocation.longitude !== 'number' ||
      !isFinite(userLocation.latitude) ||
      !isFinite(userLocation.longitude)) {
    return null;
  }
  
  return (
    <Circle 
      center={[userLocation.latitude, userLocation.longitude]}
      radius={searchRadius * 1000} // Convert km to meters for circle radius
      pathOptions={{ 
        color: isCertifiedView ? '#FFD700' : '#9b87f5',
        fillColor: isCertifiedView ? '#FFD700' : '#9b87f5',
        fillOpacity: 0.08,
        weight: 1.5,
        opacity: 0.4,
        className: 'location-radius-circle'
      }}
    />
  );
};

export default React.memo(SearchRadiusCircle);
