
import React, { Suspense } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import PageLoader from '@/components/loaders/PageLoader';

const DarkSkyLocations = React.lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = React.lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = React.lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

interface LocationContentViewProps {
  showMap: boolean;
  effectiveLocation: { latitude: number; longitude: number } | null;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  displayRadius: number;
  calculatedSearchRadius: number;
  loading: boolean;
  hasMore: boolean;
  initialLoad: boolean;
  handleLocationClick: (location: SharedAstroSpot) => void;
  handleLocationUpdate: (latitude: number, longitude: number) => void;
  loadMore: () => void;
  refreshSiqsData: () => void;
  loadMoreCalculatedLocations: () => void;
  canLoadMoreCalculated: boolean;
  loadMoreClickCount: number;
  maxLoadMoreClicks: number;
}

const LocationContentView: React.FC<LocationContentViewProps> = ({
  showMap,
  effectiveLocation,
  certifiedLocations,
  calculatedLocations,
  activeView,
  displayRadius,
  calculatedSearchRadius,
  loading,
  hasMore,
  initialLoad,
  handleLocationClick,
  handleLocationUpdate,
  loadMore,
  refreshSiqsData,
  loadMoreCalculatedLocations,
  canLoadMoreCalculated,
  loadMoreClickCount,
  maxLoadMoreClicks
}) => {
  // Filter calculated locations by distance
  const filteredCalculatedLocations = calculatedLocations.filter(loc => {
    if (!effectiveLocation) return true;
    const distance = loc.distance || calculateDistance(
      effectiveLocation.latitude,
      effectiveLocation.longitude,
      loc.latitude,
      loc.longitude
    );
    return distance <= calculatedSearchRadius;
  });
  
  return showMap ? (
    <Suspense fallback={<PageLoader />}>
      <div className="h-auto w-full rounded-lg overflow-hidden border border-border shadow-lg">
        <PhotoPointsMap 
          userLocation={effectiveLocation}
          locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
          certifiedLocations={certifiedLocations}
          calculatedLocations={calculatedLocations}
          activeView={activeView}
          searchRadius={displayRadius}
          onLocationClick={handleLocationClick}
          onLocationUpdate={handleLocationUpdate}
        />
      </div>
    </Suspense>
  ) : (
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
            onLoadMore={loadMore}
            onRefresh={refreshSiqsData}
            searchRadius={calculatedSearchRadius}
            initialLoad={initialLoad}
            onLoadMoreCalculated={loadMoreCalculatedLocations}
            canLoadMoreCalculated={canLoadMoreCalculated}
            loadMoreClickCount={loadMoreClickCount}
            maxLoadMoreClicks={maxLoadMoreClicks}
          />
        )}
      </div>
    </Suspense>
  );
};

export default LocationContentView;
