
import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import ViewToggle from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import PhotoPointsView from '@/components/photoPoints/PhotoPointsView';
import { usePhotoPointsState } from '@/hooks/photoPoints/usePhotoPointsState';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { prepareLocationForNavigation } from '@/utils/locationNavigation';
import { isSiqsGreaterThan } from '@/utils/siqsHelpers';
import ForecastDaySlider from '@/components/photoPoints/ForecastDaySlider';
import { Button } from '@/components/ui/button';
import { SunMoon } from 'lucide-react';
import { useForecastSpots } from '@/hooks/photoPoints/useForecastSpots';

const PhotoPointsNearby: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    locationInitialized,
    calculatedSearchRadius,
    currentSearchRadius,
    forecastDay,
    showForecast,
    handleRadiusChange,
    handleForecastDayChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView,
    toggleForecastMode
  } = usePhotoPointsState();

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
    currentSearchRadius
  );
  
  // Get forecast spots with the forecast hook
  const {
    forecastSpots,
    loading: forecastLoading,
    refreshForecastSpots
  } = useForecastSpots({
    userLocation: effectiveLocation,
    searchRadius: calculatedSearchRadius,
    forecastDay,
    enabled: showForecast && activeView === 'calculated'
  });
  
  // Get certified and calculated locations from the hook
  const { 
    certifiedLocations, 
    calculatedLocations 
  } = useCertifiedLocations(locations);

  // Update search radius when view changes, but avoid unnecessary refreshes
  useEffect(() => {
    if (locationInitialized && effectiveLocation) {
      setSearchRadius(currentSearchRadius);
      refreshSiqsData();
    }
  }, [locationInitialized, effectiveLocation, currentSearchRadius, setSearchRadius, refreshSiqsData]);
  
  React.useEffect(() => {
    if (locations.length > 0) {
      console.log(`Total locations before filtering: ${locations.length}`);
      const validLocations = locations.filter(loc => isSiqsGreaterThan(loc.siqs, 0) || loc.isDarkSkyReserve || loc.certification);
      console.log(`Valid locations after SIQS filtering: ${validLocations.length}`);
    }
  }, [locations]);
  
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (!location) return;
    
    try {
      const navigationData = prepareLocationForNavigation(location);
      
      if (navigationData) {
        navigate(`/location/${navigationData.locationId}`, { 
          state: navigationData.locationState 
        });
        console.log("Opening location details", navigationData.locationId);
      }
    } catch (error) {
      console.error("Error navigating to location details:", error, location);
    }
  }, [navigate]);
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={effectiveLocation}
        locationLoading={locationLoading}
        getPosition={handleResetLocation}
        showMapToggle={true}
        showMap={showMap}
        toggleMapView={toggleMapView}
      />
      
      <ViewToggle
        activeView={activeView}
        onViewChange={handleViewChange}
        loading={false} // Remove loading dependency for instant switching
      />
      
      {activeView === 'calculated' && (
        <div className="max-w-xl mx-auto mb-4">
          <DistanceRangeSlider
            currentValue={calculatedSearchRadius}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={1000}
            stepValue={100}
            loading={loading && !locationLoading}
            loadingComplete={!loading && !locationLoading}
          />
          
          {/* Forecast Mode Toggle Button */}
          <div className="mt-2 mb-4 flex justify-center">
            <Button
              variant={showForecast ? "default" : "outline"}
              size="sm"
              onClick={toggleForecastMode}
              className="gap-2"
            >
              <SunMoon className="h-4 w-4" />
              {showForecast ? 
                t("Forecast Mode: ON", "预测模式：开启") : 
                t("Forecast Mode: OFF", "预测模式：关闭")}
            </Button>
          </div>
          
          {/* Show Forecast Day Slider when forecast mode is enabled */}
          {showForecast && (
            <div className="max-w-xl mx-auto mb-4">
              <ForecastDaySlider
                currentValue={forecastDay}
                onValueChange={handleForecastDayChange}
                minValue={1}
                maxValue={15}
                stepValue={1}
                loading={forecastLoading}
              />
            </div>
          )}
        </div>
      )}
      
      {showMap && activeView === 'calculated' && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          {t(
            "Click anywhere on the map to update your search location!",
            "点击地图上的任意位置以更新搜索位置！"
          )}
        </div>
      )}
      
      <PhotoPointsView
        showMap={showMap}
        activeView={activeView}
        initialLoad={initialLoad}
        effectiveLocation={effectiveLocation}
        certifiedLocations={certifiedLocations}
        calculatedLocations={calculatedLocations}
        forecastLocations={forecastSpots}
        searchRadius={currentSearchRadius}
        calculatedSearchRadius={calculatedSearchRadius}
        forecastDay={forecastDay}
        showForecast={showForecast}
        loading={loading && !locationLoading}
        forecastLoading={forecastLoading}
        hasMore={hasMore}
        loadMore={loadMore}
        refreshSiqs={showForecast ? refreshForecastSpots : refreshSiqsData}
        onLocationClick={handleLocationClick}
        onLocationUpdate={handleLocationUpdate}
        canLoadMoreCalculated={canLoadMoreCalculated}
        loadMoreCalculated={loadMoreCalculatedLocations}
        loadMoreClickCount={loadMoreClickCount}
        maxLoadMoreClicks={maxLoadMoreClicks}
      />
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;
