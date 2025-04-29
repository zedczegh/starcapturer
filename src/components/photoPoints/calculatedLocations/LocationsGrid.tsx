
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from '../PhotoPointCard';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
  initialLoad?: boolean;
  isMobile?: boolean;
  onViewDetails?: (location: SharedAstroSpot) => void;
  isForecastMode?: boolean;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({ 
  locations,
  initialLoad = false,
  isMobile = false,
  onViewDetails,
  isForecastMode = false
}) => {
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Update locations with real-time SIQS
  useEffect(() => {
    if (locations.length > 0) {
      // Only update non-forecast locations with real-time SIQS
      if (!isForecastMode) {
        const updateWithSiqs = async () => {
          try {
            const updated = await updateLocationsWithRealTimeSiqs(locations);
            setEnhancedLocations(updated);
          } catch (err) {
            console.error("Error updating grid locations with real-time SIQS:", err);
            // Fallback to original locations
            setEnhancedLocations(locations);
          }
        };
        
        updateWithSiqs();
      } else {
        // For forecast locations, just use them as is
        setEnhancedLocations(locations);
      }
    } else {
      setEnhancedLocations([]);
    }
  }, [locations, isForecastMode]);

  const locationsToDisplay = enhancedLocations.length > 0 ? enhancedLocations : locations;
  
  // Create a handler function that wraps the onViewDetails callback
  // to match the expected function signature
  const handleViewDetails = (location: SharedAstroSpot) => (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onViewDetails) {
      onViewDetails(location);
    }
  };
  
  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'} gap-4 mb-6`}>
      {locationsToDisplay.map((location, index) => (
        <motion.div
          key={location.id || `${location.latitude}-${location.longitude}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <PhotoPointCard
            point={location}
            onViewDetails={handleViewDetails(location)}
            userLocation={null} // This doesn't use current location for distance
          />
        </motion.div>
      ))}
    </div>
  );
};

export default LocationsGrid;
