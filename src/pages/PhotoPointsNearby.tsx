
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { usePhotoPointsLocation } from '@/hooks/photoPoints/usePhotoPointsLocation';
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import PageLoader from '@/components/loaders/PageLoader';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from '@/components/ui/button';
import { Map, List } from 'lucide-react';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';
import { calculateDistance } from '@/utils/geoUtils';

const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

const DEFAULT_CALCULATED_RADIUS = 100; // 100km default radius for calculated locations
const DEFAULT_CERTIFIED_RADIUS = 100000; // 100000km for certified locations (effectively global)

const PhotoPointsNearby: React.FC = () => {
  const { 
    loading: locationLoading, 
    coords, 
    getPosition, 
    error: locationError 
  } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 60000, // Use cached position for 1 minute to avoid repeated calls
    timeout: 10000 // Timeout after 10 seconds
  });
  
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Use our new location hook for centralized location management
  const {
    effectiveLocation,
    handleLocationUpdate,
    handleResetLocation
  } = usePhotoPointsLocation(coords, getPosition, locationError);
  
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(DEFAULT_CALCULATED_RADIUS);
  
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
    activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius
  );

  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(
    locations
  );

  const handleRadiusChange = useCallback((value: number) => {
    if (activeView === 'calculated') {
      setCalculatedSearchRadius(value);
      setSearchRadius(value);
    }
  }, [setSearchRadius, activeView]);
  
  const handleViewChange = useCallback((view: PhotoPointsViewMode) => {
    setActiveView(view);
    
    if (view === 'certified') {
      setSearchRadius(DEFAULT_CERTIFIED_RADIUS);
    } else {
      setSearchRadius(calculatedSearchRadius);
    }
    
    clearLocationCache();
  }, [setSearchRadius, calculatedSearchRadius]);
  
  // Use effect for active view changes
  useEffect(() => {
    if (activeView === 'certified') {
      setSearchRadius(DEFAULT_CERTIFIED_RADIUS);
    } else {
      setSearchRadius(calculatedSearchRadius);
    }
  }, [activeView, setSearchRadius, calculatedSearchRadius]);
  
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
      console.log("Opening location details", locationId);
    }
  }, [navigate]);

  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Determine which locations to show based on active view
  const locationsToShow = activeView === 'certified' ? certifiedLocations : calculatedLocations;
  
  // Display radius based on active view
  const displayRadius = activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius;
  
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
              searchRadius={displayRadius}
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
