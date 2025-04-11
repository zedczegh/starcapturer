
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import ViewToggle from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import PageLoader from '@/components/loaders/PageLoader';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from '@/components/ui/button';
import { Map, List } from 'lucide-react';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';
import { calculateDistance } from '@/utils/geoUtils';
import { usePhotoPointsView, DEFAULT_CALCULATED_RADIUS, DEFAULT_CERTIFIED_RADIUS } from '@/hooks/photoPoints/usePhotoPointsView';
import { useLocationManagement } from '@/hooks/photoPoints/useLocationManagement';

const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

const PhotoPointsNearby: React.FC = () => {
  // Location management hook
  const {
    userLocation,
    manualLocationOverride,
    effectiveLocation,
    locationLoading,
    locationLoadAttempts,
    handleResetLocation
  } = useLocationManagement();
  
  const [initialLoad, setInitialLoad] = useState(true);
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // View management hook
  const {
    searchRadius,
    setSearchRadius,
    locations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks
  } = useRecommendedLocations(
    effectiveLocation, 
    DEFAULT_CALCULATED_RADIUS
  );

  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(
    locations, 
    searchRadius
  );

  // Use the photo points view hook
  const {
    activeView,
    showMap,
    calculatedSearchRadius,
    handleRadiusChange,
    handleViewChange,
    toggleMapView
  } = usePhotoPointsView({
    onSearchRadiusChange: setSearchRadius
  });
  
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    const newLocation = { latitude, longitude };
    
    setManualLocationOverride(newLocation);
    setUserLocation(newLocation);
    
    try {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      console.log("Updated user location from map click:", newLocation);
    } catch (err) {
      console.error("Error saving location to localStorage:", err);
    }
    
    try {
      clearLocationCache();
      console.log("Cleared location cache after location change");
    } catch (err) {
      console.error("Error clearing location cache:", err);
    }
    
    refreshSiqsData();
  }, [refreshSiqsData]);

  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
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
      toast.info(t("Opening location details", "正在打开位置详情"));
    }
  }, [navigate, t]);

  // Set initial load to false after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Filter calculated locations by distance
  const filteredCalculatedLocations = calculatedLocations.filter(loc => {
    if (!effectiveLocation) return true;
    const distance = loc.distance || calculateDistance(
      effectiveLocation.latitude,
      effectiveLocation.longitude,
      loc.latitude,
      loc.longitude
    );
    return distance <= calculatedSearchRadius;
  });
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={effectiveLocation}
        locationLoading={locationLoading}
        getPosition={handleResetLocation}
      />
      
      <ViewToggle
        activeView={activeView}
        onViewChange={handleViewChange}
        loading={loading && !locationLoading}
      />
      
      <div className="flex justify-end mb-4">
        <Button 
          onClick={toggleMapView}
          variant="outline"
          size="sm"
          className="shadow-sm hover:bg-muted/60"
        >
          {showMap ? (
            <><List className="mr-2 h-4 w-4" /> {t("Show List", "显示列表")}</>
          ) : (
            <><Map className="mr-2 h-4 w-4" /> {t("Show Map", "显示地图")}</>
          )}
        </Button>
      </div>
      
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
              userLocation={effectiveLocation}
              locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
              certifiedLocations={certifiedLocations}
              calculatedLocations={calculatedLocations}
              activeView={activeView}
              searchRadius={activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius}
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
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;
