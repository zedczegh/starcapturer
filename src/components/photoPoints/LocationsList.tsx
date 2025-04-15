
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
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'done'>('idle');
  
  // Update locations with real-time SIQS - no distance filtering
  useEffect(() => {
    if (locations.length > 0 && updateStatus === 'idle') {
      const updateWithSiqs = async () => {
        try {
          setUpdateStatus('updating');
          
          // Always process ALL locations without distance filtering
          // Use 'certified' mode to ensure proper handling of certified locations
          const updated = await updateLocationsWithRealTimeSiqs(
            locations,
            null, 
            100000, // Very large radius to ensure all locations are included
            'certified'
          );
          
          console.log(`LocationsList: Enhanced ${updated.length} locations with SIQS data`);
          setEnhancedLocations(updated);
          setUpdateStatus('done');
        } catch (err) {
          console.error("Error updating locations with real-time SIQS:", err);
          setEnhancedLocations(locations);
          setUpdateStatus('idle');
        }
      };
      
      updateWithSiqs();
    } else if (locations.length === 0) {
      setEnhancedLocations([]);
      setUpdateStatus('idle');
    }
  }, [locations]);
  
  // Reset update status when locations array changes
  useEffect(() => {
    setUpdateStatus('idle');
  }, [locations.length]);

  const locationsToDisplay = enhancedLocations.length > 0 ? enhancedLocations : locations;
  
  // Sort locations to show certified locations first, then by SIQS score
  const sortedLocations = React.useMemo(() => {
    return [...locationsToDisplay].sort((a, b) => {
      // First, prioritize by certification
      const aIsCertified = Boolean(a.isDarkSkyReserve || a.certification);
      const bIsCertified = Boolean(b.isDarkSkyReserve || b.certification);
      
      if (aIsCertified && !bIsCertified) return -1;
      if (!aIsCertified && bIsCertified) return 1;
      
      // Then sort by SIQS score (higher first)
      return (b.siqs || 0) - (a.siqs || 0);
    });
  }, [locationsToDisplay]);
  
  return (
    <div className="space-y-4 pb-8">
      {/* Container for photo point cards */}
      <div className="grid grid-cols-1 gap-4">
        {sortedLocations.map((location, index) => (
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
      {(loading || updateStatus === 'updating') && !initialLoad && (
        <div className="flex justify-center pt-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
        </div>
      )}
    </div>
  );
};

export default LocationsList;
