
import React, { useCallback, useEffect, useState } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { findForecastLocations } from '@/services/location/forecastSpotService';
import { Button } from "@/components/ui/button";
import { Calendar, CalendarIcon } from "lucide-react";

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
    selectedForecastDay,
    showForecast,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView,
    handleForecastDayChange,
    toggleForecastView
  } = usePhotoPointsState();

  // State for forecast locations
  const [forecastLocations, setForecastLocations] = useState<SharedAstroSpot[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);

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
  
  // Load forecast locations when selectedForecastDay changes
  useEffect(() => {
    const loadForecastLocations = async () => {
      if (!effectiveLocation || !showForecast || activeView !== 'calculated') {
        return;
      }
      
      setForecastLoading(true);
      
      try {
        const forecastSpots = await findForecastLocations(effectiveLocation, {
          day: selectedForecastDay,
          radius: calculatedSearchRadius,
          maxPoints: 20
        });
        
        setForecastLocations(forecastSpots);
      } catch (error) {
        console.error("Error loading forecast locations:", error);
        setForecastLocations([]);
      } finally {
        setForecastLoading(false);
      }
    };
    
    loadForecastLocations();
  }, [effectiveLocation, selectedForecastDay, calculatedSearchRadius, showForecast, activeView]);
  
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

  // Format the forecast date for display
  const formatForecastDate = (day: number): string => {
    if (day === 0) return t("Today", "今天");
    
    const date = new Date();
    date.setDate(date.getDate() + day);
    
    // Format as "Weekday, Month Day" (e.g., "Monday, July 3")
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
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
        <div className="max-w-xl mx-auto mb-6">
          <DistanceRangeSlider
            currentValue={calculatedSearchRadius}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={1000}
            stepValue={100}
            loading={loading && !locationLoading}
            loadingComplete={!loading && !locationLoading}
          />
          
          {/* Forecast toggle button */}
          <div className="mt-2 mb-3 flex justify-center">
            <Button 
              variant={showForecast ? "secondary" : "outline"} 
              size="sm" 
              onClick={toggleForecastView}
              className="flex items-center gap-2"
            >
              <Calendar size={16} />
              {showForecast 
                ? t("Forecast Mode", "预测模式") 
                : t("Enable Forecast", "启用预测")}
            </Button>
          </div>
          
          {/* Forecast day selector */}
          {showForecast && (
            <div className="mb-4 px-4">
              <div className="text-sm text-center mb-2 text-muted-foreground">
                {formatForecastDate(selectedForecastDay)}
              </div>
              <Slider
                min={0}
                max={14}
                step={1}
                value={[selectedForecastDay]}
                onValueChange={(value) => handleForecastDayChange(value[0])}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{t("Today", "今天")}</span>
                <span>7 {t("days", "天")}</span>
                <span>14 {t("days", "天")}</span>
              </div>
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
        calculatedLocations={showForecast ? forecastLocations : calculatedLocations}
        searchRadius={currentSearchRadius}
        calculatedSearchRadius={calculatedSearchRadius}
        loading={showForecast ? forecastLoading : (loading && !locationLoading)}
        hasMore={!showForecast && hasMore}
        loadMore={loadMore}
        refreshSiqs={refreshSiqsData}
        onLocationClick={handleLocationClick}
        onLocationUpdate={handleLocationUpdate}
        canLoadMoreCalculated={!showForecast && canLoadMoreCalculated}
        loadMoreCalculated={loadMoreCalculatedLocations}
        loadMoreClickCount={loadMoreClickCount}
        maxLoadMoreClicks={maxLoadMoreClicks}
        isForecastMode={showForecast}
        selectedForecastDay={selectedForecastDay}
      />
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;
