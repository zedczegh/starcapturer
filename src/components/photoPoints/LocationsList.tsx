
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from './PhotoPointCard';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LocationsListProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  initialLoad: boolean;
  onViewDetails: (point: SharedAstroSpot) => void;
}

const LocationsList: React.FC<LocationsListProps> = ({
  locations,
  loading,
  initialLoad,
  onViewDetails
}) => {
  // Safeguard against null locations
  const validLocations = Array.isArray(locations) ? locations : [];
  
  return (
    <div className="space-y-4 pb-8">
      {/* Container for photo point cards */}
      <div className="grid grid-cols-1 gap-4">
        {validLocations.map((location, index) => (
          <motion.div
            key={location.id || `${location.latitude}-${location.longitude}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
          >
            <PhotoPointCard
              point={location}
              onViewDetails={onViewDetails}
              userLocation={null} // This doesn't use current location for distance
            />
          </motion.div>
        ))}
      </div>

      {/* Show empty state when no locations and not loading */}
      {validLocations.length === 0 && !loading && !initialLoad && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No locations found</p>
        </div>
      )}

      {/* Loading state for additional locations */}
      {loading && !initialLoad && (
        <div className="flex justify-center pt-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
        </div>
      )}
    </div>
  );
};

export default LocationsList;
