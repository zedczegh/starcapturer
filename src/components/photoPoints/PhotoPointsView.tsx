
import React, { useCallback, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointsMap from './map/PhotoPointsMap';
import CalculatedLocations from './CalculatedLocations';
import { LocationListFilter } from './ViewToggle';

interface PhotoPointsViewProps {
  showMap: boolean;
  activeFilter: LocationListFilter;
  initialLoad: boolean;
  effectiveLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshSiqs?: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (lat: number, lng: number) => void;
  canLoadMore?: boolean;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
}

const PhotoPointsView: React.FC<PhotoPointsViewProps> = ({
  showMap,
  activeFilter,
  initialLoad,
  effectiveLocation,
  locations,
  searchRadius,
  loading,
  hasMore,
  loadMore,
  refreshSiqs,
  onLocationClick,
  onLocationUpdate,
  canLoadMore = false,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 2
}) => {
  const handleMapLocationUpdate = useCallback((lat: number, lng: number) => {
    onLocationUpdate(lat, lng);
  }, [onLocationUpdate]);

  // Filter locations based on the active filter
  const filteredLocations = useMemo(() => {
    if (activeFilter === 'all') return locations;
    
    return locations.filter(loc => {
      const isCertified = Boolean(loc.isDarkSkyReserve || loc.certification);
      return activeFilter === 'certified' ? isCertified : !isCertified;
    });
  }, [locations, activeFilter]);

  return (
    <div className="mt-4">
      {showMap && (
        <div className="mb-6 relative max-w-xl mx-auto">
          <PhotoPointsMap
            userLocation={effectiveLocation}
            locations={locations} // Show all locations on map
            onLocationClick={onLocationClick}
            onLocationUpdate={handleMapLocationUpdate}
            searchRadius={searchRadius}
          />
        </div>
      )}

      {!showMap && (
        <CalculatedLocations
          locations={filteredLocations}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRefresh={refreshSiqs}
          searchRadius={searchRadius}
          initialLoad={initialLoad}
          canLoadMoreCalculated={canLoadMore}
          onLoadMoreCalculated={loadMore}
          loadMoreClickCount={loadMoreClickCount}
          maxLoadMoreClicks={maxLoadMoreClicks}
          onViewDetails={onLocationClick}
        />
      )}
    </div>
  );
};

export default React.memo(PhotoPointsView);
