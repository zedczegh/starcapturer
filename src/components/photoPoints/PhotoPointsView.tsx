
import React, { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointsMap from './map/PhotoPointsMap';
import CalculatedLocations from './CalculatedLocations';
import CertifiedLocations from './CertifiedLocations';
import ObscuraLocations from './ObscuraLocations';
import MountainsLocations from './MountainsLocations';
import { sortLocationsBySiqs } from '@/utils/siqsHelpers';

interface PhotoPointsViewProps {
  showMap: boolean;
  activeView: 'certified' | 'calculated' | 'obscura' | 'mountains';
  initialLoad: boolean;
  effectiveLocation: { latitude: number; longitude: number } | null;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  obscuraLocations?: SharedAstroSpot[];
  mountainsLocations?: SharedAstroSpot[];
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
  obscuraLocations = [],
  mountainsLocations = [],
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
  const handleMapLocationUpdate = useCallback((lat: number, lng: number) => {
    onLocationUpdate(lat, lng);
  }, [onLocationUpdate]);

  // Memoize sorted locations to prevent unnecessary re-renders
  const sortedCertifiedLocations = React.useMemo(() => 
    sortLocationsBySiqs(certifiedLocations), [certifiedLocations]);
  const sortedCalculatedLocations = React.useMemo(() => 
    sortLocationsBySiqs(calculatedLocations), [calculatedLocations]);
  const sortedObscuraLocations = React.useMemo(() => 
    sortLocationsBySiqs(obscuraLocations), [obscuraLocations]);
  const sortedMountainsLocations = React.useMemo(() => 
    sortLocationsBySiqs(mountainsLocations), [mountainsLocations]);

  // Determine which locations to show on map - memoized per view for instant switching
  const mapLocations = React.useMemo(() => {
    const locations = {
      certified: sortedCertifiedLocations,
      obscura: sortedObscuraLocations,
      mountains: sortedMountainsLocations,
      calculated: sortedCalculatedLocations
    };
    return locations[activeView] || sortedCalculatedLocations;
  }, [activeView, sortedCertifiedLocations, sortedObscuraLocations, sortedMountainsLocations, sortedCalculatedLocations]);

  return (
    <div className="mt-4">
      {showMap && (
        <div className="mb-6 relative max-w-xl mx-auto">
          <PhotoPointsMap
            userLocation={effectiveLocation}
            locations={mapLocations}
            onLocationClick={onLocationClick}
            onLocationUpdate={handleMapLocationUpdate}
            searchRadius={activeView === 'calculated' ? calculatedSearchRadius : searchRadius}
            certifiedLocations={sortedCertifiedLocations}
            calculatedLocations={sortedCalculatedLocations}
            activeView={activeView}
          />
        </div>
      )}

      {!showMap && activeView === 'certified' && (
        <CertifiedLocations
          locations={sortedCertifiedLocations}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onViewDetails={onLocationClick}
          onRefresh={refreshSiqs}
          initialLoad={initialLoad}
        />
      )}

      {!showMap && activeView === 'calculated' && (
        <CalculatedLocations
          locations={sortedCalculatedLocations}
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
      )}

      {!showMap && activeView === 'obscura' && (
        <ObscuraLocations
          locations={sortedObscuraLocations}
          loading={loading}
          onViewDetails={onLocationClick}
          onRefresh={refreshSiqs}
          initialLoad={initialLoad}
          userLocation={effectiveLocation}
        />
      )}

      {!showMap && activeView === 'mountains' && (
        <MountainsLocations
          locations={sortedMountainsLocations}
          loading={loading}
          onViewDetails={onLocationClick}
          onRefresh={refreshSiqs}
          initialLoad={initialLoad}
          userLocation={effectiveLocation}
        />
      )}
    </div>
  );
};

export default React.memo(PhotoPointsView);
