
import React, { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointsMap from './map/PhotoPointsMap';
import CalculatedLocations from './CalculatedLocations';
import CertifiedLocations from './CertifiedLocations';

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
  error?: Error | null;
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
  error
}) => {
  const handleMapLocationUpdate = useCallback((lat: number, lng: number) => {
    onLocationUpdate(lat, lng);
  }, [onLocationUpdate]);

  return (
    <div className="mt-4">
      {showMap && (
        <div className="mb-6 relative max-w-xl mx-auto">
          <PhotoPointsMap
            userLocation={effectiveLocation}
            locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
            onLocationClick={onLocationClick}
            onLocationUpdate={handleMapLocationUpdate}
            searchRadius={activeView === 'calculated' ? calculatedSearchRadius : searchRadius}
            certifiedLocations={certifiedLocations}
            calculatedLocations={calculatedLocations}
            activeView={activeView}
          />
        </div>
      )}

      {!showMap && activeView === 'certified' && (
        <CertifiedLocations
          locations={certifiedLocations}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onViewDetails={onLocationClick}
          onRefresh={refreshSiqs}
          initialLoad={initialLoad}
          error={error}
        />
      )}

      {!showMap && activeView === 'calculated' && (
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
          error={error}
        />
      )}
    </div>
  );
};

export default React.memo(PhotoPointsView);
