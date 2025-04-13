
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from '../PhotoPointCard';
import { motion } from 'framer-motion';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
  onSelectLocation: (location: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({
  locations,
  onSelectLocation,
  userLocation
}) => {
  if (!locations || locations.length === 0) {
    return null;
  }

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
            onSelect={onSelectLocation}
            onViewDetails={() => onSelectLocation(location)}
            userLocation={userLocation}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default LocationsGrid;
