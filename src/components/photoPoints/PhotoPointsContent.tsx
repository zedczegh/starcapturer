
import React, { lazy, Suspense } from 'react';
import { PhotoPointsViewMode } from '@/hooks/photoPoints/usePhotoPointsNearby';
import ViewToggle from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLoader from '@/components/loaders/PageLoader';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useNavigate } from 'react-router-dom';

const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

interface PhotoPointsContentProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: PhotoPointsViewMode;
  showMap: boolean;
  handleViewChange: (view: PhotoPointsViewMode) => void;
  calculatedSearchRadius: number;
  handleRadiusChange: (value: number) => void;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  filteredCalculatedLocations: SharedAstroSpot[];
  loading: boolean;
  locationLoading: boolean;
  initialLoad: boolean;
  searchRadius: number;
  handleLocationUpdate: (latitude: number, longitude: number) => void;
  hasMore: boolean;
  loadMore: () => void;
  refreshSiqsData: () => void;
  canLoadMoreCalculated: boolean;
  loadMoreCalculatedLocations: () => void;
  loadMoreClickCount: number;
  maxLoadMoreClicks: number;
}

const PhotoPointsContent: React.FC<PhotoPointsContentProps> = ({
  userLocation,
  activeView,
  showMap,
  handleViewChange,
  calculatedSearchRadius,
  handleRadiusChange,
  certifiedLocations,
  calculatedLocations,
  filteredCalculatedLocations,
  loading,
  locationLoading,
  initialLoad,
  searchRadius,
  handleLocationUpdate,
  hasMore,
  loadMore,
  refreshSiqsData,
  canLoadMoreCalculated,
  loadMoreCalculatedLocations,
  loadMoreClickCount,
  maxLoadMoreClicks
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const handleLocationClick = (location: SharedAstroSpot) => {
    if (location && location.latitude && location.longitude) {
      const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
      navigate(`/location/${locationId}`, { 
        state: {
          id: locationId,
          name: location.name,
          chineseName: location.chineseName,
          latitude: location.latitude,
          longitude: location.longitude,
          bortleScale: location.bortleScale || 4,
          siqs: location.siqs,
          siqsResult: location.siqs ? { score: location.siqs } : undefined,
          certification: location.certification,
          isDarkSkyReserve: location.isDarkSkyReserve,
          timestamp: new Date().toISOString(),
          fromPhotoPoints: true
        } 
      });
      console.log("Opening location details", locationId);
    }
  };
  
  return (
    <>
      <ViewToggle
        activeView={activeView}
        onViewChange={handleViewChange}
        loading={loading && !locationLoading}
      />
      
      {activeView === 'calculated' && (
        <div className="max-w-xl mx-auto mb-6">
          <DistanceRangeSlider
            currentValue={calculatedSearchRadius}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={1000}
            stepValue={100}
          />
        </div>
      )}
      
      {showMap && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          {t(
            "Click anywhere on the map to select that location. The map will center on your current location if available.",
            "点击地图上的任意位置以选择该位置。如果可用，地图将以您当前位置为中心。"
          )}
        </div>
      )}
      
      {showMap ? (
        <Suspense fallback={<PageLoader />}>
          <div className="h-auto w-full rounded-lg overflow-hidden border border-border shadow-lg">
            <PhotoPointsMap 
              userLocation={userLocation}
              locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
              certifiedLocations={certifiedLocations}
              calculatedLocations={calculatedLocations}
              activeView={activeView}
              searchRadius={searchRadius}
              onLocationClick={handleLocationClick}
              onLocationUpdate={handleLocationUpdate}
            />
          </div>
        </Suspense>
      ) : (
        <Suspense fallback={<PageLoader />}>
          <div className="min-h-[300px]">
            {activeView === 'certified' ? (
              <DarkSkyLocations
                locations={certifiedLocations}
                loading={loading && !locationLoading}
                initialLoad={initialLoad}
              />
            ) : (
              <CalculatedLocations
                locations={filteredCalculatedLocations}
                loading={loading && !locationLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onRefresh={refreshSiqsData}
                searchRadius={calculatedSearchRadius}
                initialLoad={initialLoad}
                onLoadMoreCalculated={loadMoreCalculatedLocations}
                canLoadMoreCalculated={canLoadMoreCalculated}
                loadMoreClickCount={loadMoreClickCount}
                maxLoadMoreClicks={maxLoadMoreClicks}
              />
            )}
          </div>
        </Suspense>
      )}
    </>
  );
};

export default PhotoPointsContent;
