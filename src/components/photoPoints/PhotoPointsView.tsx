
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
  forecastLocations?: SharedAstroSpot[];
  searchRadius: number;
  calculatedSearchRadius: number;
  forecastDay?: number;
  showForecast?: boolean;
  loading: boolean;
  forecastLoading?: boolean;
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
  forecastLocations = [],
  searchRadius,
  calculatedSearchRadius,
  forecastDay = 1,
  showForecast = false,
  loading,
  forecastLoading = false,
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
  
  // Determine which locations to display based on mode
  const displayLocations = activeView === 'certified' 
    ? certifiedLocations
    : (showForecast ? forecastLocations : calculatedLocations);
    
  // Combine loading states
  const isLoading = loading || (showForecast && forecastLoading);

  return (
    <div className="mt-4">
      {showMap && (
        <div className="mb-6 relative max-w-xl mx-auto">
          <PhotoPointsMap
            userLocation={effectiveLocation}
            locations={displayLocations}
            onLocationClick={onLocationClick}
            onLocationUpdate={handleMapLocationUpdate}
            searchRadius={activeView === 'calculated' ? calculatedSearchRadius : searchRadius}
            certifiedLocations={certifiedLocations}
            calculatedLocations={calculatedLocations}
            forecastLocations={forecastLocations}
            activeView={activeView}
            showForecast={showForecast}
            forecastDay={forecastDay}
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
        />
      )}

      {!showMap && activeView === 'calculated' && (
        <CalculatedLocations
          locations={showForecast ? forecastLocations : calculatedLocations}
          loading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRefresh={refreshSiqs}
          searchRadius={calculatedSearchRadius}
          initialLoad={initialLoad}
          canLoadMoreCalculated={canLoadMoreCalculated && !showForecast}
          onLoadMoreCalculated={loadMoreCalculated}
          loadMoreClickCount={loadMoreClickCount}
          maxLoadMoreClicks={maxLoadMoreClicks}
          isForecastMode={showForecast}
          forecastDay={showForecast ? forecastDay : undefined}
        />
      )}
    </div>
  );
};

export default React.memo(PhotoPointsView);
