
import React, { useState, useRef, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { PhotoPointsViewMode } from './ViewToggle';
import PageLoader from '@/components/loaders/PageLoader';
import { calculateDistance } from '@/utils/geoUtils';
import DarkSkyLocations from '@/components/photoPoints/DarkSkyLocations';
import CalculatedLocations from '@/components/photoPoints/CalculatedLocations';

// Only lazy load the map component which is larger
const PhotoPointsMap = React.lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

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

const PhotoPointsView: React.FC<PhotoPointsViewProps> = (props) => {
  const {
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
  } = props;
  
  const [loaderVisible, setLoaderVisible] = useState(initialLoad || loading);
  
  // For calculated view - filter by distance, certified view - show all
  const filteredCalculatedLocations = React.useMemo(() => {
    if (!effectiveLocation) return calculatedLocations;
    
    return calculatedLocations.filter(loc => {
      if (!loc.latitude || !loc.longitude) return false;
      
      // Skip distance filtering for certified locations
      if (loc.isDarkSkyReserve || loc.certification) return true;
      
      // Calculate distance if not already set
      const distance = loc.distance || calculateDistance(
        effectiveLocation.latitude,
        effectiveLocation.longitude,
        loc.latitude,
        loc.longitude
      );
      
      // Only include locations within current radius
      return distance <= calculatedSearchRadius;
    });
  }, [calculatedLocations, effectiveLocation, calculatedSearchRadius]);
  
  // When in certified view, don't filter by distance - show all certified locations globally
  const displayedCertifiedLocations = React.useMemo(() => {
    return certifiedLocations;
  }, [certifiedLocations]);

  const handleLocationClick = React.useCallback((location: SharedAstroSpot) => {
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
  
  // Effect to handle loader visibility
  useEffect(() => {
    setLoaderVisible(initialLoad || loading);
    const timer = setTimeout(() => {
      setLoaderVisible(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [initialLoad, loading, activeView]);
  
  // Debugging outputs
  useEffect(() => {
    console.log(`PhotoPointsView rendering`);
    console.log(`- Active view: ${activeView}`);
    console.log(`- Certified locations: ${certifiedLocations?.length || 0}`);
    console.log(`- Calculated locations: ${calculatedLocations?.length || 0}`);
    console.log(`- Show map: ${showMap}`);
    console.log(`- Search radius: ${searchRadius}`);
  }, [activeView, certifiedLocations, calculatedLocations, showMap, searchRadius]);
  
  // If loader should be shown, always render the same loading UI
  if (loaderVisible) {
    return (
      <div className="flex justify-center items-center py-12">
        <PageLoader />
      </div>
    );
  }
  
  // For map view
  if (showMap) {
    return (
      <React.Suspense fallback={<PageLoader />}>
        <div className="h-auto w-full max-w-xl mx-auto rounded-lg overflow-hidden border border-border shadow-lg">
          <PhotoPointsMap 
            userLocation={effectiveLocation}
            locations={activeView === 'certified' ? displayedCertifiedLocations : filteredCalculatedLocations}
            certifiedLocations={certifiedLocations}
            calculatedLocations={calculatedLocations}
            activeView={activeView}
            searchRadius={activeView === 'certified' ? searchRadius : calculatedSearchRadius}
            onLocationClick={handleLocationClick}
            onLocationUpdate={onLocationUpdate}
          />
        </div>
      </React.Suspense>
    );
  }
  
  // For list view - use key prop to force re-rendering on view change
  return (
    <div className="min-h-[300px]">
      {activeView === 'certified' ? (
        <DarkSkyLocations
          key="certified-view"
          locations={displayedCertifiedLocations}
          loading={loading}
          initialLoad={initialLoad}
        />
      ) : (
        <CalculatedLocations
          key="calculated-view"
          locations={filteredCalculatedLocations}
          loading={loading}
          initialLoad={initialLoad}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRefresh={refreshSiqs}
          searchRadius={calculatedSearchRadius}
          canLoadMoreCalculated={canLoadMoreCalculated}
          onLoadMoreCalculated={loadMoreCalculated}
          loadMoreClickCount={loadMoreClickCount}
          maxLoadMoreClicks={maxLoadMoreClicks}
        />
      )}
    </div>
  );
};

export default PhotoPointsView;
