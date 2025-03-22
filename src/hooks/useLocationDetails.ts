
import { useState, useCallback, useRef, useEffect } from "react";
import { useForecastManager } from "./locationDetails/useForecastManager";
import { useWeatherUpdater } from "./useWeatherUpdater";
import { clearForecastCache } from "./siqs/forecastFetcher";

export const useLocationDetails = (locationData: any, setLocationData: (data: any) => void) => {
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const initialLoadCompleteRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  
  const { 
    forecastData, 
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    setForecastData,
    handleRefreshForecast: refreshForecast,
    handleRefreshLongRangeForecast: refreshLongRange,
    weatherAlerts
  } = useForecastManager(locationData);
  
  const {
    loading,
    setLoading,
    handleRefreshAll: refreshWeather,
    updateLightPollutionData
  } = useWeatherUpdater();

  // Check if location has changed to reset cache and trigger a fresh update
  useEffect(() => {
    if (!locationData) return;
    
    const currentLocation = `${locationData.latitude?.toFixed(4)}-${locationData.longitude?.toFixed(4)}`;
    
    if (lastLocationRef.current && lastLocationRef.current !== currentLocation) {
      console.log("Location changed, clearing forecast cache");
      clearForecastCache(); // Clear cache when location changes
      initialLoadCompleteRef.current = false; // Reset to trigger a refresh
    }
    
    lastLocationRef.current = currentLocation;
  }, [locationData?.latitude, locationData?.longitude]);

  // Auto-refresh data on initial mount
  useEffect(() => {
    // Only run once and only if we have locationData
    if (!initialLoadCompleteRef.current && locationData && 
        locationData.latitude && locationData.longitude) {
      
      // Set a slight delay to ensure all components are mounted
      const timer = setTimeout(() => {
        console.log("Auto-refreshing on initial load");
        handleRefreshAll();
        initialLoadCompleteRef.current = true;
      }, 300); // Reduced delay for faster response
      
      return () => clearTimeout(timer);
    }
  }, [locationData]);

  // Memoized wrapper functions
  const handleRefreshForecast = useCallback(() => {
    if (!locationData) return;
    
    // Clear the cache for this specific location to force a fresh fetch
    clearForecastCache(locationData.latitude, locationData.longitude);
    refreshForecast(locationData.latitude, locationData.longitude);
  }, [locationData, refreshForecast]);

  const handleRefreshLongRangeForecast = useCallback(() => {
    if (!locationData) return;
    refreshLongRange(locationData.latitude, locationData.longitude);
  }, [locationData, refreshLongRange]);
  
  // Wrapper function for refreshing all data
  const handleRefreshAll = useCallback(() => {
    if (!locationData) return;
    
    const fetchBothForecasts = () => {
      handleRefreshForecast();
      handleRefreshLongRangeForecast();
    };
    
    refreshWeather(locationData, setLocationData, fetchBothForecasts, setStatusMessage);
  }, [locationData, setLocationData, refreshWeather, handleRefreshForecast, handleRefreshLongRangeForecast, setStatusMessage]);

  return {
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
    handleRefreshLongRangeForecast,
    setLoading,
    setForecastData,
    weatherAlerts
  };
};
