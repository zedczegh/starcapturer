
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

  // Ensure SIQS result is populated immediately
  useEffect(() => {
    // Check if locationData has all required information but siqsResult is missing or has score of 0
    if (locationData?.weatherData && 
        ((!locationData.siqsResult || locationData.siqsResult.score === 0) &&
         locationData.bortleScale)) {
      console.log("SIQS score missing or zero, calculating fresh score");
      
      // Calculate SIQS score from existing data without requiring a refresh
      const freshSIQSResult = calculateSIQS({
        cloudCover: locationData.weatherData.cloudCover,
        bortleScale: locationData.bortleScale || 4,
        seeingConditions: locationData.seeingConditions || 3,
        windSpeed: locationData.weatherData.windSpeed,
        humidity: locationData.weatherData.humidity,
        moonPhase: locationData.moonPhase || 0,
        aqi: locationData.weatherData.aqi,
        weatherCondition: locationData.weatherData.weatherCondition || "",
        precipitation: locationData.weatherData.precipitation || 0
      });
      
      // Update locationData with the fresh SIQS result
      setLocationData({
        ...locationData,
        siqsResult: freshSIQSResult
      });
      
      console.log("Fresh SIQS score calculated:", freshSIQSResult.score);
    }
  }, [locationData, setLocationData]);

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
