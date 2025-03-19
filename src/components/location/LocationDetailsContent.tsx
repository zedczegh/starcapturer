
import React, { memo, lazy, Suspense, useEffect } from "react";
import LocationHeader from "@/components/location/LocationHeader";
import StatusMessage from "@/components/location/StatusMessage";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { extractFutureForecasts } from "@/components/forecast/ForecastUtils";

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

  // Calculate SIQS immediately when forecast data changes
  useEffect(() => {
    // Only proceed if we have the necessary data
    if (locationData?.weatherData && locationData.bortleScale && forecastData?.hourly) {
      console.log("Calculating SIQS based on nighttime forecast data");
      
      // Extract night forecast (6 PM to 8 AM)
      const nightForecast = [];
      for (let i = 0; i < forecastData.hourly.time.length; i++) {
        const date = new Date(forecastData.hourly.time[i]);
        const hour = date.getHours();
        if (hour >= 18 || hour < 8) {
          nightForecast.push({
            time: forecastData.hourly.time[i],
            cloudCover: forecastData.hourly.cloud_cover?.[i] || 0,
            windSpeed: forecastData.hourly.wind_speed_10m?.[i] || 0,
            humidity: forecastData.hourly.relative_humidity_2m?.[i] || 0,
            precipitation: forecastData.hourly.precipitation?.[i] || 0,
            weatherCondition: forecastData.hourly.weather_code?.[i] || 0
          });
        }
      }
      
      // Skip calculation if no night forecast data
      if (nightForecast.length === 0) {
        console.log("No nighttime forecast data available");
        return;
      }
      
      // Calculate fresh SIQS score with nighttime forecast
      const freshSIQSResult = calculateSIQS({
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
      
      console.log("SIQS analysis based on nighttime conditions:", freshSIQSResult.score);
      
      // Always update the SIQS result when forecast data changes
      setLocationData({
        ...locationData,
        siqsResult: freshSIQSResult
      });
    }
  }, [forecastData, locationData, setLocationData]);

  // Log updates for debugging
  useEffect(() => {
    console.log("LocationDetailsContent updated with location:", 
      locationData?.name, locationData?.latitude, locationData?.longitude, 
      "SIQS score:", locationData?.siqsResult?.score);
  }, [locationData?.name, locationData?.latitude, locationData?.longitude, locationData?.siqsResult?.score]);

  return (
    <>
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
      
      <Suspense fallback={<div className="animate-pulse h-96 bg-slate-800/20 rounded-lg"></div>}>
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
    </>
  );
});

LocationDetailsContent.displayName = 'LocationDetailsContent';

export default LocationDetailsContent;
