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

const MapView: React.FC<{
  effectiveLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: PhotoPointsViewMode;
  searchRadius: number;
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (latitude: number, longitude: number) => void;
}> = ({
  effectiveLocation,
  locations,
  certifiedLocations,
  calculatedLocations,
  activeView,
  searchRadius,
  onLocationClick,
  onLocationUpdate
}) => {
  return (
    <div className="h-auto w-full rounded-lg overflow-hidden border border-border shadow-lg">
      <PhotoPointsMap 
        userLocation={effectiveLocation}
        locations={locations}
        certifiedLocations={certifiedLocations}
        calculatedLocations={calculatedLocations}
        activeView={activeView}
        searchRadius={searchRadius}
        onLocationClick={onLocationClick}
        onLocationUpdate={onLocationUpdate}
      />
    </div>
  );
};

const CertifiedView: React.FC<{
  certifiedLocations: SharedAstroSpot[];
  loading: boolean;
  initialLoad: boolean;
}> = ({ 
  certifiedLocations,
  loading,
  initialLoad
}) => {
  return (
    <DarkSkyLocations
      locations={certifiedLocations}
      loading={loading}
      initialLoad={initialLoad}
    />
  );
};

const CalculatedView: React.FC<{
  calculatedLocations: SharedAstroSpot[];
  effectiveLocation: { latitude: number; longitude: number } | null;
  calculatedSearchRadius: number;
  loading: boolean;
  initialLoad: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  canLoadMoreCalculated: boolean;
  loadMoreCalculated: () => void;
  loadMoreClickCount: number;
  maxLoadMoreClicks: number;
}> = ({
  calculatedLocations,
  effectiveLocation,
  calculatedSearchRadius,
  loading,
  initialLoad,
  hasMore,
  onLoadMore,
  onRefresh,
  canLoadMoreCalculated,
  loadMoreCalculated,
  loadMoreClickCount,
  maxLoadMoreClicks
}) => {
  const filteredLocations = React.useMemo(() => {
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

  return (
    <CalculatedLocations
      locations={filteredLocations}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      onRefresh={onRefresh}
      searchRadius={calculatedSearchRadius}
      initialLoad={initialLoad}
      onLoadMoreCalculated={loadMoreCalculated}
      canLoadMoreCalculated={canLoadMoreCalculated}
      loadMoreClickCount={loadMoreClickCount}
      maxLoadMoreClicks={maxLoadMoreClicks}
    />
  );
};

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
  const [lastActiveView, setLastActiveView] = useState<PhotoPointsViewMode>(activeView);
  const [showFallbackLoader, setShowFallbackLoader] = useState(false);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLastActiveView(activeView);
      setShowFallbackLoader(false);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [activeView]);
  
  useEffect(() => {
    if (lastActiveView !== activeView) {
      setShowFallbackLoader(true);
    }
  }, [lastActiveView, activeView]);
  
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (location && onLocationClick) {
      const safeLocation = {
        ...location,
        id: location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`,
        name: location.name || 'Unknown Location',
        latitude: location.latitude,
        longitude: location.longitude
      };
      
      onLocationClick(safeLocation);
    }
  }, [onLocationClick]);
  
  if ((loading && initialLoad) || showFallbackLoader) {
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
        <MapView
          effectiveLocation={effectiveLocation}
          locations={locationsToShow}
          certifiedLocations={certifiedLocations}
          calculatedLocations={calculatedLocations}
          activeView={activeView}
          searchRadius={searchRadius}
          onLocationClick={handleLocationClick}
          onLocationUpdate={onLocationUpdate}
        />
      </Suspense>
    );
  }
  
  return (
    <Suspense fallback={<PageLoader />}>
      <div className="min-h-[300px]">
        {activeView === 'certified' ? (
          <CertifiedView
            certifiedLocations={certifiedLocations}
            loading={loading}
            initialLoad={initialLoad}
          />
        ) : (
          <CalculatedView
            calculatedLocations={calculatedLocations}
            effectiveLocation={effectiveLocation}
            calculatedSearchRadius={calculatedSearchRadius}
            loading={loading}
            initialLoad={initialLoad}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onRefresh={refreshSiqs}
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
