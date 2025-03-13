
import { useState } from "react";
import { useForecastManager } from "./locationDetails/useForecastManager";
import { useWeatherUpdater } from "./useWeatherUpdater";

export const useLocationDetails = (locationData: any, setLocationData: (data: any) => void) => {
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const { 
    forecastData, 
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    setForecastData,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  } = useForecastManager(locationData);
  
  const {
    loading,
    setLoading,
    handleRefreshAll: refreshAll,
    updateLightPollutionData
  } = useWeatherUpdater();

  // Wrapper function to pass through the right parameters
  const handleRefreshAll = () => {
    if (!locationData) return;
    
    const fetchBothForecasts = () => {
      handleRefreshForecast(locationData.latitude, locationData.longitude);
      handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
    };
    
    refreshAll(locationData, setLocationData, fetchBothForecasts, setStatusMessage);
  };

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
    handleRefreshForecast: () => {
      if (!locationData) return;
      handleRefreshForecast(locationData.latitude, locationData.longitude);
    },
    handleRefreshLongRangeForecast: () => {
      if (!locationData) return;
      handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
    },
    setLoading,
    setForecastData
  };
};
