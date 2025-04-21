
import React, { useCallback, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointsMap from './map/PhotoPointsMap';
import CalculatedLocations from './CalculatedLocations';
import CertifiedLocations from './CertifiedLocations';

// Note: Changed from lazy loading to regular import to fix "Failed to fetch" error

interface PhotoPointsViewProps {
  showMap: boolean;
  activeView: 'certified' | 'calculated';
  initialLoad: boolean;
  effectiveLocation: { latitude: number; longitude: number } | null;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  searchRadius: number;
  calculatedSearchRadius: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshSiqs?: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (lat: number, lng: number) => void;
  canLoadMoreCalculated?: boolean;
  loadMoreCalculated?: () => void;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
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
  canLoadMoreCalculated = false,
  loadMoreCalculated,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 2
}) => {
  // Use memoized callback to prevent unnecessary re-renders
  const handleMapLocationUpdate = useCallback((lat: number, lng: number) => {
    onLocationUpdate(lat, lng);
  }, [onLocationUpdate]);
  
  // Memoize appropriate locations for current view to prevent recalculations
  const currentLocations = useMemo(() => 
    activeView === 'certified' ? certifiedLocations : calculatedLocations,
  [activeView, certifiedLocations, calculatedLocations]);
  
  // Only render the active view, not both
  const renderActiveList = () => {
    if (showMap) return null;
    
    if (activeView === 'certified') {
      return (
        <CertifiedLocations
          locations={certifiedLocations}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onViewDetails={onLocationClick}
          onRefresh={refreshSiqs}
          initialLoad={initialLoad}
        />
      );
    }
    
    return (
      <CalculatedLocations
        locations={calculatedLocations}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRefresh={refreshSiqs}
        searchRadius={calculatedSearchRadius}
        initialLoad={initialLoad}
        canLoadMoreCalculated={canLoadMoreCalculated}
        onLoadMoreCalculated={loadMoreCalculated}
        loadMoreClickCount={loadMoreClickCount}
        maxLoadMoreClicks={maxLoadMoreClicks}
      />
    );
  };

  return (
    <div className="mt-4">
      {showMap && (
        <div className="mb-6 relative max-w-xl mx-auto">
          <PhotoPointsMap
            userLocation={effectiveLocation}
            locations={currentLocations}
            onLocationClick={onLocationClick}
            onLocationUpdate={handleMapLocationUpdate}
            searchRadius={activeView === 'calculated' ? calculatedSearchRadius : searchRadius}
            certifiedLocations={certifiedLocations}
            calculatedLocations={calculatedLocations}
            activeView={activeView}
          />
        </div>
      )}

      {renderActiveList()}
    </div>
  );
};

// Add React.memo to prevent unnecessary re-renders
export default React.memo(PhotoPointsView);
