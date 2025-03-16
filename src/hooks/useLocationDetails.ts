
import { useState, useCallback, useRef, useEffect } from "react";
import { useForecastManager } from "./locationDetails/useForecastManager";
import { useWeatherUpdater } from "./useWeatherUpdater";

export const useLocationDetails = (locationData: any, setLocationData: (data: any) => void) => {
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const initialLoadCompleteRef = useRef(false);
  
  const { 
    forecastData, 
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    setForecastData,
    handleRefreshForecast: refreshForecast,
    handleRefreshLongRangeForecast: refreshLongRange
  } = useForecastManager(locationData);
  
  const {
    loading,
    setLoading,
    handleRefreshAll: refreshWeather,
    updateLightPollutionData
  } = useWeatherUpdater();

  // Auto-refresh data on initial mount
  useEffect(() => {
    // Only run once and only if we have locationData
    if (!initialLoadCompleteRef.current && locationData && 
        locationData.latitude && locationData.longitude) {
      
      // Set a slight delay to ensure all components are mounted
      const timer = setTimeout(() => {
        handleRefreshAll();
        initialLoadCompleteRef.current = true;
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [locationData]);

  // Memoized wrapper functions
  const handleRefreshForecast = useCallback(() => {
    if (!locationData) return;
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
    setForecastData
  };
};
