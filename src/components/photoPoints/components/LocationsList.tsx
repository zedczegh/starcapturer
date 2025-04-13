
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoPointCard from '../PhotoPointCard';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface LocationsListProps {
  locations: SharedAstroSpot[];
  onSelectPoint?: (point: SharedAstroSpot) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

const LocationsList: React.FC<LocationsListProps> = ({ 
  locations, 
  onSelectPoint,
  userLocation
}) => {
  return (
    <AnimatePresence>
      <div className="space-y-3">
        {locations.map((location, index) => (
          <motion.div
            key={`${location.id || location.latitude}-${location.longitude}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: index * 0.03 }}
          >
            <PhotoPointCard
              point={location}
              onSelect={onSelectPoint}
              onViewDetails={() => onSelectPoint?.(location)}
              userLocation={userLocation}
            />
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

export default LocationsList;
