
import React from 'react';
import { motion } from 'framer-motion';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from '../PhotoPointCard';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
  initialLoad?: boolean;
  isMobile?: boolean;
  onViewDetails?: (location: SharedAstroSpot) => void;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({ 
  locations,
  initialLoad = false,
  isMobile = false,
  onViewDetails
}) => {
  if (!locations || locations.length === 0) {
    return null;
  }

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'} gap-4 mb-6`}>
      {locations.map((location, index) => (
        <motion.div
          key={location.id || `${location.latitude}-${location.longitude}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
        >
          <PhotoPointCard
            point={location}
            onViewDetails={onViewDetails ? () => onViewDetails(location) : undefined}
            userLocation={null} // This doesn't use current location for distance
          />
        </motion.div>
      ))}
    </div>
  );
};

export default LocationsGrid;
