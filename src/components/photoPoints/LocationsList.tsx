
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from './PhotoPointCard';

interface LocationsListProps {
  locations: SharedAstroSpot[];
  onSelectLocation: (location: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  loading?: boolean; // Added missing prop
  initialLoad?: boolean; // Added missing prop
  onViewDetails?: (point: SharedAstroSpot) => void; // Added missing prop
}

const LocationsList: React.FC<LocationsListProps> = ({ 
  locations, 
  onSelectLocation, 
  userLocation,
  loading,
  initialLoad,
  onViewDetails
}) => {
  if (!locations || locations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No locations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {locations.map((point) => (
        <PhotoPointCard
          key={`${point.id || point.name}-${point.latitude}-${point.longitude}`}
          point={point}
          onSelect={onSelectLocation}
          onViewDetails={() => (onViewDetails || onSelectLocation)(point)}
          userLocation={userLocation}
        />
      ))}
    </div>
  );
};

export default LocationsList;
