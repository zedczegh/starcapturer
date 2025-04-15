import React, { lazy, Suspense, useCallback, useState, useEffect } from 'react';
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
  const [loaderVisible, setLoaderVisible] = useState(initialLoad || loading);
  
  const filteredCalculatedLocations = React.useMemo(() => {
    if (!effectiveLocation) return calculatedLocations;
    
    return calculatedLocations.filter(loc => {
      if (!loc.latitude || !loc.longitude) return false;
      
      const distance = loc.distance || calculateDistance(
        effectiveLocation.latitude,
        effectiveLocation.longitude,
        loc.latitude,
        loc.longitude
      );
      
      return distance <= calculatedSearchRadius;
    });
  }, [calculatedLocations, effectiveLocation, calculatedSearchRadius]);
  
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (location && onLocationClick) {
      const safeLocation = {
        ...location,
        id: location.id || `loc-${location.latitude?.toFixed(6)}-${location.longitude?.toFixed(6)}`,
        name: location.name || 'Unknown Location',
        latitude: location.latitude,
        longitude: location.longitude
      };
      
      onLocationClick(safeLocation);
    }
  }, [onLocationClick]);
  
  useEffect(() => {
    setLoaderVisible(initialLoad || loading);
    const timer = setTimeout(() => {
      setLoaderVisible(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [initialLoad, loading, activeView]);
  
  console.log("PhotoPointsView rendering with activeView:", activeView);
  
  if (loaderVisible) {
    return (
      <div className="flex justify-center items-center py-12">
        <PageLoader />
      </div>
    );
  }
  
  if (showMap) {
    const locationsToShow = activeView === 'certified' ? certifiedLocations : calculatedLocations;
    
    return (
      <Suspense fallback={<PageLoader />}>
        <div className="h-auto w-full rounded-lg overflow-hidden border border-border shadow-lg">
          <PhotoPointsMap 
            userLocation={effectiveLocation}
            locations={locationsToShow}
            certifiedLocations={certifiedLocations}
            calculatedLocations={calculatedLocations}
            activeView={activeView}
            searchRadius={searchRadius}
            onLocationClick={handleLocationClick}
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
            initialLoad={initialLoad}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onRefresh={refreshSiqs}
            searchRadius={calculatedSearchRadius}
            canLoadMoreCalculated={canLoadMoreCalculated}
            loadMoreCalculated={loadMoreCalculated}
            loadMoreClickCount={loadMoreClickCount}
            maxLoadMoreClicks={maxLoadMoreClicks}
          />
        )}
      </div>
    </Suspense>
  );
};

export default PhotoPointsView;
