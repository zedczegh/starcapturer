
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from '../PhotoPointCard';
import { useNavigate } from 'react-router-dom';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
}

const LocationsGrid: React.FC<LocationsGridProps> = ({ locations }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = (point: SharedAstroSpot) => {
    if (!point.latitude || !point.longitude) return;
    
    const locationId = point.id || `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
    
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: point.name,
        chineseName: point.chineseName,
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: point.bortleScale || 4,
        siqs: point.siqs,
        siqsResult: point.siqsResult || (point.siqs ? { score: typeof point.siqs === 'number' ? point.siqs : 0 } : undefined),
        certification: point.certification,
        isDarkSkyReserve: point.isDarkSkyReserve,
        timestamp: point.timestamp || new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      {locations.map(location => (
        <div key={`${location.id || location.latitude}-${location.longitude}`}>
          <PhotoPointCard
            point={location}
            onViewDetails={handleViewDetails}
            userLocation={null} 
          />
        </div>
      ))}
    </div>
  );
};

export default LocationsGrid;
