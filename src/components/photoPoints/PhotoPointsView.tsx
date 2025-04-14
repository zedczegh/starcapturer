
import React, { lazy, Suspense } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { PhotoPointsViewMode } from './ViewToggle';
import PageLoader from '@/components/loaders/PageLoader';
import { calculateDistance } from '@/utils/geoUtils';

const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

interface PhotoPointsViewProps {
  showMap: boolean;
  activeView: PhotoPointsViewMode;
  initialLoad: boolean;
  effectiveLocation: { latitude: number; longitude: number } | null;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  searchRadius: number;
  calculatedSearchRadius: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshSiqs: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (latitude: number, longitude: number) => void;
  canLoadMoreCalculated: boolean;
  loadMoreCalculated: () => void;
  loadMoreClickCount: number;
  maxLoadMoreClicks: number;
}

const PhotoPointsView: React.FC<PhotoPointsViewProps> = ({
  showMap,
  activeView,
  initialLoad,
  effectiveLocation,
  certifiedLocations,
  calculatedLocations,
  searchRadius,
  calculatedSearchRadius,
  loading,
  hasMore,
  loadMore,
  refreshSiqs,
  onLocationClick,
  onLocationUpdate,
  canLoadMoreCalculated,
  loadMoreCalculated,
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

  if (showMap) {
    return (
      <Suspense fallback={<PageLoader />}>
        <div className="h-auto w-full rounded-lg overflow-hidden border border-border shadow-lg">
          <PhotoPointsMap 
            userLocation={effectiveLocation}
            locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
            certifiedLocations={certifiedLocations}
            calculatedLocations={calculatedLocations}
            activeView={activeView}
            searchRadius={searchRadius}
            onLocationClick={onLocationClick}
            onLocationUpdate={onLocationUpdate}
          />
        </div>
      </Suspense>
    );
  }
  
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
            onLoadMore={loadMore}
            onRefresh={refreshSiqs}
            searchRadius={calculatedSearchRadius}
            initialLoad={initialLoad}
            onLoadMoreCalculated={loadMoreCalculated}
            canLoadMoreCalculated={canLoadMoreCalculated}
            loadMoreClickCount={loadMoreClickCount}
            maxLoadMoreClicks={maxLoadMoreClicks}
          />
        )}
      </div>
    </Suspense>
  );
};

export default PhotoPointsView;
