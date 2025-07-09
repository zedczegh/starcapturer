import React, { memo, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { optimizeListRendering } from '@/utils/performanceOptimizer';
import PhotoPointCard from '../PhotoPointCard';

interface OptimizedPhotoPointsListProps {
  locations: SharedAstroSpot[];
  maxVisible?: number;
  onLoadMore?: () => void;
}

/**
 * Optimized photo points list with virtual rendering
 */
const OptimizedPhotoPointsList = memo<OptimizedPhotoPointsListProps>(({
  locations,
  maxVisible = 50,
  onLoadMore
}) => {
  // Optimize rendering for large lists
  const { visibleItems, hasMore } = useMemo(
    () => optimizeListRendering(locations, maxVisible),
    [locations, maxVisible]
  );

  // Memoize the card list to prevent unnecessary re-renders
  const cardList = useMemo(
    () => visibleItems.map((location, index) => (
      <PhotoPointCard
        key={`${location.id}-${location.latitude}-${location.longitude}`}
        point={location}
        onSelect={() => {}}
        onViewDetails={() => {}}
        userLocation={null}
      />
    )),
    [visibleItems]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {cardList}
      </div>
      
      {hasMore && onLoadMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Load More ({locations.length - maxVisible} remaining)
          </button>
        </div>
      )}
    </div>
  );
});

OptimizedPhotoPointsList.displayName = 'OptimizedPhotoPointsList';

export default OptimizedPhotoPointsList;