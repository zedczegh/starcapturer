
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
}

const LocationsGrid: React.FC<LocationsGridProps> = ({ 
  locations,
  initialLoad = false,
  isMobile = false,
  onViewDetails
}) => {
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Update locations with real-time SIQS in batches to avoid UI freezing
  useEffect(() => {
    if (locations.length > 0) {
      // First, just use the original locations to prevent UI freezing
      setEnhancedLocations(locations);
      
      // Then update with real-time SIQS in the background
      const updateWithSiqs = async () => {
        try {
          // Process in small batches to prevent UI freezing
          const BATCH_SIZE = 5;
          let updatedLocations = [...locations];
          
          for (let i = 0; i < locations.length; i += BATCH_SIZE) {
            const batch = locations.slice(i, i + BATCH_SIZE);
            const updatedBatch = await updateLocationsWithRealTimeSiqs(batch);
            
            // Update this batch in the overall array
            updatedBatch.forEach((updated, index) => {
              updatedLocations[i + index] = updated;
            });
            
            // Update state after each batch to show progress
            setEnhancedLocations([...updatedLocations]);
            
            // Small timeout to allow UI to breathe
            if (i + BATCH_SIZE < locations.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (err) {
          console.error("Error updating grid locations with real-time SIQS:", err);
          // We already have the original locations as fallback
        }
      };
      
      updateWithSiqs();
    } else {
      setEnhancedLocations([]);
    }
  }, [locations]);

  const locationsToDisplay = enhancedLocations.length > 0 ? enhancedLocations : locations;
  
  // Create a handler function that wraps the onViewDetails callback
  const handleViewDetails = (location: SharedAstroSpot) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails && location) {
      onViewDetails(location);
    }
  };
  
  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'} gap-4 mb-6`}>
      {locationsToDisplay.map((location, index) => (
        <motion.div
          key={location.id || `${location.latitude}-${location.longitude}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(0.05 * index, 0.5) }} // Cap the delay for better performance
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
