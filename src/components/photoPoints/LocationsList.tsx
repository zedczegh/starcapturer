
import React, { useEffect, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from './PhotoPointCard';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';

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
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Update locations with real-time SIQS - no distance filtering
  useEffect(() => {
    if (locations.length > 0) {
      const updateWithSiqs = async () => {
        try {
          // Always use a large radius and null location to ensure all locations are processed
          const updated = await updateLocationsWithRealTimeSiqs(
            locations,
            null, 
            100000,
            'certified'
          );
          console.log(`LocationsList: Enhanced ${updated.length} locations with SIQS data`);
          setEnhancedLocations(updated);
        } catch (err) {
          console.error("Error updating locations with real-time SIQS:", err);
          setEnhancedLocations(locations);
        }
      };
      
      updateWithSiqs();
    } else {
      setEnhancedLocations([]);
    }
  }, [locations]);

  const locationsToDisplay = enhancedLocations.length > 0 ? enhancedLocations : locations;
  
  return (
    <div className="space-y-4 pb-8">
      {/* Container for photo point cards */}
      <div className="grid grid-cols-1 gap-4">
        {locationsToDisplay.map((location, index) => (
          <motion.div
            key={location.id || `${location.latitude}-${location.longitude}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <PhotoPointCard
              point={location}
              onViewDetails={onViewDetails}
              userLocation={null} // Explicitly null to avoid distance filtering
            />
          </motion.div>
        ))}
      </div>

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
