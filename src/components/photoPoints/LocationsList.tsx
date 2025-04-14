
import React, { useEffect, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from './PhotoPointCard';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';

interface LocationsListProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  initialLoad?: boolean;
  onLocationClick: (point: SharedAstroSpot) => void;
  onViewDetails?: (point: SharedAstroSpot) => void; // Add this alternative prop
  onRefresh?: () => void;
  activeView?: 'certified' | 'calculated';
  hasMore?: boolean;
  onLoadMore?: () => void;
  canLoadMoreCalculated?: boolean;
  onLoadMoreCalculated?: () => void;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
}

const LocationsList: React.FC<LocationsListProps> = ({
  locations,
  loading,
  initialLoad = false,
  onLocationClick,
  onViewDetails, // Add the new prop
  onRefresh,
  activeView = 'certified',
  hasMore = false,
  onLoadMore,
  canLoadMoreCalculated = false,
  onLoadMoreCalculated,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 3
}) => {
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Update certified locations with real-time SIQS
  useEffect(() => {
    if (locations.length > 0) {
      const updateWithSiqs = async () => {
        try {
          // Apply real-time SIQS to all locations including certified ones
          const updated = await updateLocationsWithRealTimeSiqs(
            locations,
            null, // We don't need user location for certified locations
            100000, // Large radius to include all certified locations
            'certified'
          );
          setEnhancedLocations(updated);
        } catch (err) {
          console.error("Error updating locations with real-time SIQS:", err);
          // Fallback to original locations
          setEnhancedLocations(locations);
        }
      };
      
      updateWithSiqs();
    } else {
      setEnhancedLocations([]);
    }
  }, [locations]);

  const locationsToDisplay = enhancedLocations.length > 0 ? enhancedLocations : locations;
  
  // Handle load more
  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
    }
  };
  
  // Handle load more calculated
  const handleLoadMoreCalculated = () => {
    if (onLoadMoreCalculated) {
      onLoadMoreCalculated();
    }
  };

  // Choose the appropriate click handler - use onViewDetails if provided, otherwise use onLocationClick
  const handleLocationClick = (location: SharedAstroSpot) => {
    if (onViewDetails) {
      onViewDetails(location);
    } else {
      onLocationClick(location);
    }
  };

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
              onViewDetails={() => handleLocationClick(location)}
              userLocation={null} // This doesn't use current location for distance
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

      {/* Load more buttons */}
      {!loading && hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            className="px-4 py-2 bg-primary/80 hover:bg-primary text-primary-foreground rounded-md text-sm"
            onClick={handleLoadMore}
          >
            Load More Locations
          </button>
        </div>
      )}

      {/* Load more calculated button */}
      {!loading && canLoadMoreCalculated && activeView === 'calculated' && onLoadMoreCalculated && (
        <div className="flex justify-center pt-4">
          <button
            className="px-4 py-2 bg-primary/80 hover:bg-primary text-primary-foreground rounded-md text-sm"
            onClick={handleLoadMoreCalculated}
            disabled={loadMoreClickCount >= maxLoadMoreClicks}
          >
            {loadMoreClickCount < maxLoadMoreClicks 
              ? `Load More Calculated Locations (${loadMoreClickCount}/${maxLoadMoreClicks})` 
              : "Maximum locations reached"}
          </button>
        </div>
      )}

      {/* Refresh button */}
      {onRefresh && (
        <div className="flex justify-center pt-4">
          <button
            className="px-4 py-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-md text-sm"
            onClick={onRefresh}
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationsList;
