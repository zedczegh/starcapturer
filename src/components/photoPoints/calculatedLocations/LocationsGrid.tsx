
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from '../PhotoPointCard';
import { motion } from 'framer-motion';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
  onSelectLocation?: (location: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  initialLoad?: boolean; // Added missing prop
  isMobile?: boolean; // Added missing prop
  onViewDetails?: (point: SharedAstroSpot) => void; // Added missing prop
}

const LocationsGrid: React.FC<LocationsGridProps> = ({
  locations,
  onSelectLocation,
  userLocation,
  initialLoad,
  isMobile,
  onViewDetails
}) => {
  if (!locations || locations.length === 0) {
    return null;
  }

  const handleSelect = (location: SharedAstroSpot) => {
    if (onSelectLocation) {
      onSelectLocation(location);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {locations.map((location, index) => (
        <motion.div
          key={`${location.id || location.name}-${location.latitude}-${location.longitude}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <PhotoPointCard
            point={location}
            onSelect={handleSelect}
            onViewDetails={() => 
              onViewDetails ? onViewDetails(location) : handleSelect(location)
            }
            userLocation={userLocation}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default LocationsGrid;
