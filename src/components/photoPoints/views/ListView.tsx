
import React, { Suspense } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PageLoader from '@/components/loaders/PageLoader';
import { calculateDistance } from '@/utils/geoUtils';

const DarkSkyLocations = React.lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = React.lazy(() => import('@/components/photoPoints/CalculatedLocations'));

interface ListViewProps {
  activeView: 'certified' | 'calculated';
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  userLocation: { latitude: number; longitude: number } | null;
  calculatedSearchRadius: number;
  loading: boolean;
  initialLoad: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  canLoadMoreCalculated: boolean;
  onLoadMoreCalculated: () => void;
  loadMoreClickCount: number;
  maxLoadMoreClicks: number;
}

const ListView: React.FC<ListViewProps> = ({
  activeView,
  locations,
  certifiedLocations,
  calculatedLocations,
  userLocation,
  calculatedSearchRadius,
  loading,
  initialLoad,
  hasMore,
  onLoadMore,
  onRefresh,
  canLoadMoreCalculated,
  onLoadMoreCalculated,
  loadMoreClickCount,
  maxLoadMoreClicks
}) => {
  // Filter calculated locations by search radius
  const filteredCalculatedLocations = calculatedLocations.filter(loc => {
    if (!userLocation) return true;
    const distance = loc.distance || calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      loc.latitude,
      loc.longitude
    );
    return distance <= calculatedSearchRadius;
  });
  
  return (
    <Suspense fallback={<PageLoader />}>
      <div className="min-h-[300px]">
        {activeView === 'certified' ? (
          <DarkSkyLocations
            locations={certifiedLocations}
            loading={loading}
            initialLoad={initialLoad}
          />
        ) : (
          <CalculatedLocations
            locations={filteredCalculatedLocations}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            onRefresh={onRefresh}
            searchRadius={calculatedSearchRadius}
            initialLoad={initialLoad}
            onLoadMoreCalculated={onLoadMoreCalculated}
            canLoadMoreCalculated={canLoadMoreCalculated}
            loadMoreClickCount={loadMoreClickCount}
            maxLoadMoreClicks={maxLoadMoreClicks}
          />
        )}
      </div>
    </Suspense>
  );
};

export default ListView;
