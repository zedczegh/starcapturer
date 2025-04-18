
import { useState, useCallback, useRef, useEffect } from "react";
import { useForecastManager } from "./locationDetails/useForecastManager";
import { useWeatherUpdater } from "./useWeatherUpdater";
import { clearForecastCache } from "./siqs/forecastFetcher";
import { useWeatherSynchronizer } from "./locationDetails/useWeatherSynchronizer";
import { useSIQSUpdater } from "./locationDetails/useSIQSUpdater";

// Queue system to prevent multiple simultaneous updates
const updateQueue = {
  pending: false,
  lastUpdate: 0,
  minInterval: 3000 // minimum 3 seconds between updates
};

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

  // Auto-refresh data on initial mount with debouncing
  useEffect(() => {
    // Only run once and only if we have locationData
    if (!initialLoadCompleteRef.current && locationData && 
        locationData.latitude && locationData.longitude) {
      
      // Don't queue multiple updates
      if (updateQueue.pending) return;
      
      // Check if we should throttle
      const now = Date.now();
      if (now - updateQueue.lastUpdate < updateQueue.minInterval) {
        const delay = updateQueue.minInterval - (now - updateQueue.lastUpdate);
        updateQueue.pending = true;
        
        const timer = setTimeout(() => {
          handleRefreshAll();
          updateQueue.lastUpdate = Date.now();
          updateQueue.pending = false;
          initialLoadCompleteRef.current = true;
        }, delay);
        
        return () => clearTimeout(timer);
      }
      
      // No throttling needed, update immediately
      updateQueue.pending = true;
      const timer = setTimeout(() => {
        handleRefreshAll();
        updateQueue.lastUpdate = Date.now();
        updateQueue.pending = false;
        initialLoadCompleteRef.current = true;
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [locationData]);

  // Update SIQS score when forecast data is available with debouncing
  useEffect(() => {
    if (!forecastData || forecastLoading || !locationData) return;
    
    // Avoid rapid multiple updates
    if (updateQueue.pending) return;
    
    const now = Date.now();
    if (now - updateQueue.lastUpdate < updateQueue.minInterval) return;
    
    updateQueue.pending = true;
    
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      // Sync weather data with forecast data
      syncWeatherWithForecast(forecastData, locationData, setLocationData);
      
      // Update SIQS using forecast data
      updateSIQSWithForecast(locationData, forecastData, forecastLoading, setLocationData);
      
      updateQueue.lastUpdate = Date.now();
      updateQueue.pending = false;
    });
  }, [forecastData, forecastLoading, locationData, setLocationData, syncWeatherWithForecast, updateSIQSWithForecast]);

  // Optimized refresh functions with debouncing
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
  
  // Wrapper function for refreshing all data with optimized batching
  const handleRefreshAll = useCallback(() => {
    if (!locationData) return;
    
    // Reset SIQS update flag
    resetUpdateState();
    
    const fetchBothForecasts = () => {
      // Use a small delay between API calls to avoid overwhelming the network
      handleRefreshForecast();
      setTimeout(() => {
        handleRefreshLongRangeForecast();
      }, 300);
    };
    
    refreshWeather(locationData, setLocationData, fetchBothForecasts, setStatusMessage);
    
    // Schedule periodic data sync to ensure consistency with debouncing
    if (dataSyncTimerRef.current) {
      window.clearTimeout(dataSyncTimerRef.current);
    }
    
    dataSyncTimerRef.current = window.setTimeout(() => {
      if (forecastData) {
        syncWeatherWithForecast(forecastData, locationData, setLocationData);
      }
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
