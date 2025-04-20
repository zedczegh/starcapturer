
import { useState, useCallback, useRef, useEffect } from "react";
import { useForecastManager } from "./locationDetails/useForecastManager";
import { useWeatherUpdater } from "./useWeatherUpdater";
import { clearForecastCache } from "./siqs/forecastFetcher";
import { useWeatherSynchronizer } from "./locationDetails/useWeatherSynchronizer";
import { useSIQSUpdater } from "./locationDetails/useSIQSUpdater";

export const useLocationDetails = (locationData: any, setLocationData: (data: any) => void) => {
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const initialLoadCompleteRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const dataSyncTimerRef = useRef<number | null>(null);
  
  const { syncWeatherWithForecast } = useWeatherSynchronizer();
  const { updateSIQSWithForecast, resetUpdateState } = useSIQSUpdater();
  
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
      resetUpdateState(); // Reset SIQS update flag
      
      // Clear any existing sync timer
      if (dataSyncTimerRef.current) {
        window.clearTimeout(dataSyncTimerRef.current);
        dataSyncTimerRef.current = null;
      }
    }
    
    lastLocationRef.current = currentLocation;
  }, [locationData?.latitude, locationData?.longitude, resetUpdateState]);

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

  // Update SIQS score when forecast data is available and ensure data consistency
  useEffect(() => {
    if (forecastData && !forecastLoading && locationData) {
      // Sync weather data with forecast data
      syncWeatherWithForecast(forecastData, locationData, setLocationData);
      
      // Update SIQS using forecast data
      updateSIQSWithForecast(locationData, forecastData, forecastLoading, setLocationData);
    }
  }, [forecastData, forecastLoading, locationData, setLocationData, syncWeatherWithForecast, updateSIQSWithForecast]);

  // Memoized wrapper functions
  const handleRefreshForecast = useCallback(() => {
    if (!locationData) return;
    
    // Reset SIQS update flag to ensure it updates again
    resetUpdateState();
    
    // Clear the cache for this specific location to force a fresh fetch
    clearForecastCache(locationData.latitude, locationData.longitude);
    refreshForecast(locationData.latitude, locationData.longitude);
  }, [locationData, refreshForecast, resetUpdateState]);

  const handleRefreshLongRangeForecast = useCallback(() => {
    if (!locationData) return;
    refreshLongRange(locationData.latitude, locationData.longitude);
  }, [locationData, refreshLongRange]);
  
  // Wrapper function for refreshing all data
  const handleRefreshAll = useCallback(() => {
    if (!locationData) return;
    
    // Reset SIQS update flag
    resetUpdateState();
    
    const fetchBothForecasts = () => {
      handleRefreshForecast();
      handleRefreshLongRangeForecast();
    };
    
    refreshWeather(locationData, setLocationData, fetchBothForecasts, setStatusMessage);
    
    // Schedule periodic data sync to ensure consistency
    if (dataSyncTimerRef.current) {
      window.clearTimeout(dataSyncTimerRef.current);
    }
    
    dataSyncTimerRef.current = window.setTimeout(() => {
      syncWeatherWithForecast(forecastData, locationData, setLocationData);
      dataSyncTimerRef.current = null;
    }, 5000); // Check for data consistency after 5 seconds
  }, [locationData, setLocationData, refreshWeather, handleRefreshForecast, handleRefreshLongRangeForecast, setStatusMessage, syncWeatherWithForecast, forecastData, resetUpdateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dataSyncTimerRef.current) {
        window.clearTimeout(dataSyncTimerRef.current);
      }
    };
  }, []);

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
