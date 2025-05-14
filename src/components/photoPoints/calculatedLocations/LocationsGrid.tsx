
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from '../PhotoLocationCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
  onLocationClick?: (location: SharedAstroSpot) => void;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({ 
  locations, 
  onLocationClick 
}) => {
  const isMobile = useIsMobile();
  
  if (!locations || locations.length === 0) {
    return null;
  }

  return (
    <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
      {locations.map((location) => (
        <PhotoLocationCard
          key={location.id || `${location.latitude}-${location.longitude}`}
          location={location}
          onClick={() => onLocationClick?.(location)}
        />
      ))}
    </div>
  );
};

export default LocationsGrid;
