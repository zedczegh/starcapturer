
import { useState, useEffect } from "react";
import { useForecastData } from "./useForecastData";
import { useWeatherUpdater } from "./useWeatherUpdater";
import { useLightPollutionData } from "./useLightPollutionData";

export const useLocationDetails = (locationData: any, setLocationData: (data: any) => void) => {
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const { 
    forecastData, 
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    setForecastData,
    fetchLocationForecast,
    fetchLongRangeForecast,
    handleRefreshForecast: refreshForecast,
    handleRefreshLongRangeForecast: refreshLongRange
  } = useForecastData();
  
  const {
    loading,
    setLoading,
    handleRefreshAll: refreshAll,
    updateLightPollutionData
  } = useWeatherUpdater();

  useEffect(() => {
    if (locationData) {
      fetchLocationForecast(locationData.latitude, locationData.longitude, setStatusMessage);
      fetchLongRangeForecast(locationData.latitude, locationData.longitude, setStatusMessage);
      updateLightPollutionData(locationData, setLocationData);
    }
  }, [locationData]);

  // Wrapper functions to pass through the right parameters
  const handleRefreshAll = () => {
    if (!locationData) return;
    
    const fetchBothForecasts = () => {
      fetchLocationForecast(locationData.latitude, locationData.longitude, setStatusMessage);
      fetchLongRangeForecast(locationData.latitude, locationData.longitude, setStatusMessage);
    };
    
    refreshAll(locationData, setLocationData, fetchBothForecasts, setStatusMessage);
  };

  const handleRefreshForecast = () => {
    if (!locationData) return;
    refreshForecast(locationData.latitude, locationData.longitude, setStatusMessage);
  };

  const handleRefreshLongRangeForecast = () => {
    if (!locationData) return;
    refreshLongRange(locationData.latitude, locationData.longitude, setStatusMessage);
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
    handleRefreshForecast,
    handleRefreshLongRangeForecast,
    setLoading,
    setForecastData
  };
};
