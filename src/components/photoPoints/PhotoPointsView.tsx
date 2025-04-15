
import React, { lazy, Suspense, useCallback, useState, useEffect, memo } from 'react';
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

// Memoized map view component to prevent unnecessary re-renders
const MapView = memo(({
  effectiveLocation,
  locations,
  certifiedLocations,
  calculatedLocations,
  activeView,
  searchRadius,
  onLocationClick,
  onLocationUpdate
}: {
  effectiveLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: PhotoPointsViewMode;
  searchRadius: number;
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (latitude: number, longitude: number) => void;
}) => {
  // Consistent use of hooks for all render paths
  const [mapKey] = useState(`map-${activeView}-${Date.now()}`);
  
  return (
    <div className="h-auto w-full rounded-lg overflow-hidden border border-border shadow-lg" key={mapKey}>
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
});

MapView.displayName = 'MapView';

// Memoized certified view component
const CertifiedView = memo(({ 
  certifiedLocations,
  loading,
  initialLoad
}: { 
  certifiedLocations: SharedAstroSpot[];
  loading: boolean;
  initialLoad: boolean;
}) => {
  console.log("Rendering CertifiedView with locations:", certifiedLocations.length);
  
  return (
    <DarkSkyLocations
      locations={certifiedLocations}
      loading={loading}
      initialLoad={initialLoad}
    />
  );
});

CertifiedView.displayName = 'CertifiedView';

// Memoized calculated view component
const CalculatedView = memo(({
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
}: {
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
}) => {
  console.log("Rendering CalculatedView with locations:", calculatedLocations.length);
  
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
});

CalculatedView.displayName = 'CalculatedView';

// Main component with consistent hooks usage
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
  // Use stable state object to prevent inconsistent hook calls
  const [viewState] = useState({
    activatedViews: { certified: false, calculated: false }
  });
  
  const [showFallbackLoader, setShowFallbackLoader] = useState(false);
  
  // Mark the active view as activated
  useEffect(() => {
    if (activeView === 'certified') {
      viewState.activatedViews.certified = true;
    } else if (activeView === 'calculated') {
      viewState.activatedViews.calculated = true;
    }
  }, [activeView, viewState]);
  
  // Show loader briefly during view transitions
  useEffect(() => {
    setShowFallbackLoader(true);
    const timer = setTimeout(() => {
      setShowFallbackLoader(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeView]);
  
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
  
  console.log("PhotoPointsView rendering with activeView:", activeView);
  
  // Always include a loading state for consistent hook usage
  if ((loading && initialLoad) || showFallbackLoader) {
    return (
      <div className="flex justify-center items-center py-12">
        <PageLoader />
      </div>
    );
  }
  
  // Map view with consistent prop passing
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
  
  // Always return the same component structure but conditionally render content
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
