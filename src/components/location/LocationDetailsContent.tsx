
import React, { memo, lazy, Suspense, useEffect } from "react";
import LocationHeader from "@/components/location/LocationHeader";
import StatusMessage from "@/components/location/StatusMessage";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { calculateSIQS } from "@/lib/calculateSIQS";

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

  // Calculate SIQS immediately on component mount and when relevant data changes
  useEffect(() => {
    // Only proceed if we have the necessary data
    if (locationData?.weatherData && locationData.bortleScale) {
      console.log("Checking if SIQS calculation is needed");
      
      // Get night forecast if available (for more accurate SIQS)
      let nightForecast = [];
      if (forecastData && forecastData.hourly) {
        // Extract night hours (6 PM to 8 AM)
        const hourlyItems = [];
        for (let i = 0; i < forecastData.hourly.time.length; i++) {
          const date = new Date(forecastData.hourly.time[i]);
          const hour = date.getHours();
          if (hour >= 18 || hour < 8) {
            hourlyItems.push({
              time: forecastData.hourly.time[i],
              cloudCover: forecastData.hourly.cloud_cover?.[i] || 0,
              windSpeed: forecastData.hourly.wind_speed_10m?.[i] || 0,
              humidity: forecastData.hourly.relative_humidity_2m?.[i] || 0,
              precipitation: forecastData.hourly.precipitation?.[i] || 0,
              weatherCondition: forecastData.hourly.weather_code?.[i] || 0
            });
          }
        }
        nightForecast = hourlyItems;
      }
      
      // Calculate fresh SIQS score
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
      
      // Only update if we have a different score or missing score
      if (!locationData.siqsResult || 
          Math.abs(locationData.siqsResult.score - freshSIQSResult.score) > 0.1) {
        console.log("Updating SIQS score from", 
          locationData.siqsResult?.score, "to", freshSIQSResult.score);
        
        setLocationData({
          ...locationData,
          siqsResult: freshSIQSResult
        });
      }
    }
  }, [
    locationData?.weatherData, 
    locationData?.bortleScale, 
    forecastData, 
    setLocationData, 
    locationData
  ]);

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
