
import React, { memo, lazy, Suspense, useEffect, useCallback } from "react";
import LocationHeader from "@/components/location/LocationHeader";
import StatusMessage from "@/components/location/StatusMessage";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { extractNightForecasts, hasHighCloudCover } from "@/components/forecast/ForecastUtils";
import { useLanguage } from "@/contexts/LanguageContext";

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

  // Calculate SIQS with focus on nighttime conditions
  const calculateNighttimeSIQS = useCallback(() => {
    // Only proceed if we have the necessary data
    if (locationData?.weatherData && locationData.bortleScale && forecastData?.hourly) {
      console.log("Using nighttime forecast data for SIQS calculation");
      
      // Extract night forecasts (6 PM to 8 AM)
      const nightForecast = extractNightForecasts(forecastData.hourly);
      
      // If no night forecast data, use current conditions
      if (nightForecast.length === 0) {
        console.log("No nighttime forecast data available, using current conditions");
        return;
      }
      
      console.log("Night forecast items: ", nightForecast.length);
      
      // Check if any night forecast has cloud cover over 40%
      const hasHighClouds = hasHighCloudCover(nightForecast, 40);
      
      let freshSIQSResult;
      
      if (hasHighClouds) {
        // If cloud cover is over 40% during night, set SIQS to 0 and not viable
        console.log("Cloud cover over 40% detected in nighttime - setting SIQS to 0");
        freshSIQSResult = {
          score: 0,
          isViable: false,
          factors: [
            {
              name: "cloudCover",
              score: 0,
              description: t(
                "Cloud cover exceeds 40% during night hours, making astrophotography not viable",
                "夜间云层覆盖率超过40%，天文摄影不可行"
              )
            }
          ]
        };
      } else {
        // Calculate fresh SIQS score with nighttime forecast
        freshSIQSResult = calculateSIQS({
          cloudCover: locationData.weatherData.cloudCover,
          bortleScale: locationData.bortleScale,
          seeingConditions: locationData.seeingConditions || 3,
          windSpeed: locationData.weatherData.windSpeed,
          humidity: locationData.weatherData.humidity,
          moonPhase: locationData.moonPhase || 0,
          aqi: locationData.weatherData.aqi,
          weatherCondition: locationData.weatherData.weatherCondition || "",
          precipitation: locationData.weatherData.precipitation || 0,
          nightForecast: nightForecast
        });
      }
      
      console.log("SIQS analysis based on nighttime conditions:", freshSIQSResult.score);
      
      // Update the SIQS result when forecast data changes
      setLocationData({
        ...locationData,
        siqsResult: freshSIQSResult
      });
    }
  }, [forecastData, locationData, setLocationData, t]);

  // Calculate SIQS immediately when forecast data changes
  useEffect(() => {
    if (forecastData && forecastData.hourly) {
      calculateNighttimeSIQS();
    }
  }, [forecastData, calculateNighttimeSIQS]);

  // Recalculate SIQS when location is updated
  useEffect(() => {
    // Delay slightly to ensure all data is loaded
    const timer = setTimeout(() => {
      if (locationData?.weatherData && locationData.bortleScale && forecastData?.hourly) {
        calculateNighttimeSIQS();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [locationData?.latitude, locationData?.longitude, locationData?.name]);

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
          onLocationUpdate={onLocationUpdate}
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
