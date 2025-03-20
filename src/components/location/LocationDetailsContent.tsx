
import React, { memo, lazy, Suspense, useEffect, useCallback } from "react";
import LocationHeader from "@/components/location/LocationHeader";
import StatusMessage from "@/components/location/StatusMessage";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateNighttimeSIQS, useAutoRefreshOnLoad } from "@/utils/nighttimeSIQS";

// Lazy load the content grid for better performance
const LocationContentGrid = lazy(() => import("@/components/location/LocationContentGrid"));

interface LocationDetailsContentProps {
  locationData: any;
  setLocationData: (data: any) => void;
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
}

const LocationDetailsContent = memo<LocationDetailsContentProps>(({
  locationData,
  setLocationData,
  onLocationUpdate
}) => {
  const { t } = useLanguage();
  const {
    forecastData,
    longRangeForecast,
    loading,
    forecastLoading,
    longRangeLoading,
    gettingUserLocation,
    statusMessage,
    setStatusMessage,
    setGettingUserLocation,
    handleRefreshAll,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  } = useLocationDetails(locationData, setLocationData);

  // Auto-refresh on initial load
  useAutoRefreshOnLoad(handleRefreshAll);

  // Handle location update with auto-refresh
  const handleLocationUpdateWithRefresh = useCallback(async (location: { name: string; latitude: number; longitude: number }) => {
    try {
      // First update the location data
      await onLocationUpdate(location);
      
      // Then automatically refresh all data
      console.log("Location updated, automatically refreshing data...");
      setTimeout(() => {
        handleRefreshAll();
      }, 500);
      
    } catch (error) {
      console.error("Error during location update and refresh:", error);
    }
  }, [onLocationUpdate, handleRefreshAll]);

  // Calculate SIQS with focus on nighttime conditions
  const updateSIQSWithNighttimeData = useCallback(() => {
    // Only proceed if we have the necessary data
    if (locationData?.weatherData && forecastData?.hourly) {
      console.log("Using nighttime forecast data for SIQS calculation");
      
      // Calculate fresh SIQS using the utility function
      const freshSIQSResult = calculateNighttimeSIQS(locationData, forecastData, t);
      
      if (freshSIQSResult) {
        console.log("SIQS analysis based on nighttime conditions:", freshSIQSResult.score);
        
        // Update the SIQS result when forecast data changes
        setLocationData({
          ...locationData,
          siqsResult: freshSIQSResult
        });
      }
    }
  }, [forecastData, locationData, setLocationData, t]);

  // Calculate SIQS immediately when forecast data changes
  useEffect(() => {
    if (forecastData && forecastData.hourly) {
      updateSIQSWithNighttimeData();
    }
  }, [forecastData, updateSIQSWithNighttimeData]);

  // Log updates for debugging
  useEffect(() => {
    console.log("LocationDetailsContent updated with location:", 
      locationData?.name, locationData?.latitude, locationData?.longitude, 
      "SIQS score:", locationData?.siqsResult?.score);
  }, [locationData?.name, locationData?.latitude, locationData?.longitude, locationData?.siqsResult?.score]);

  return (
    <div className="transition-all duration-300 animate-fade-in">
      <StatusMessage 
        message={statusMessage} 
        onClear={() => setStatusMessage(null)} 
      />
      
      <LocationHeader 
        name={locationData.name}
        latitude={locationData.latitude}
        longitude={locationData.longitude}
        timestamp={locationData.timestamp}
        loading={loading}
        onRefresh={handleRefreshAll}
      />
      
      <Suspense fallback={
        <div className="animate-pulse h-96 rounded-lg bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">{t("Loading content...", "正在加载内容...")}</p>
          </div>
        </div>
      }>
        <LocationContentGrid 
          locationData={locationData}
          forecastData={forecastData}
          longRangeForecast={longRangeForecast}
          forecastLoading={forecastLoading}
          longRangeLoading={longRangeLoading}
          gettingUserLocation={gettingUserLocation}
          onLocationUpdate={handleLocationUpdateWithRefresh}
          setGettingUserLocation={setGettingUserLocation}
          setStatusMessage={setStatusMessage}
          onRefreshForecast={handleRefreshForecast}
          onRefreshLongRange={handleRefreshLongRangeForecast}
        />
      </Suspense>
    </div>
  );
});

LocationDetailsContent.displayName = 'LocationDetailsContent';

export default LocationDetailsContent;
