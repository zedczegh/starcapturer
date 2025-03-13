
import { useState, useEffect } from "react";
import { useForecastData } from "../useForecastData";

export const useForecastManager = (locationData: any) => {
  const { 
    forecastData, 
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    setForecastData,
    fetchLocationForecast,
    fetchLongRangeForecast,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  } = useForecastData();

  useEffect(() => {
    if (locationData) {
      fetchLocationForecast(locationData.latitude, locationData.longitude);
      fetchLongRangeForecast(locationData.latitude, locationData.longitude);
    }
  }, [locationData, fetchLocationForecast, fetchLongRangeForecast]);

  return {
    forecastData, 
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    setForecastData,
    handleRefreshForecast: (latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => 
      handleRefreshForecast(latitude, longitude, setStatusMessage),
    handleRefreshLongRangeForecast: (latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => 
      handleRefreshLongRangeForecast(latitude, longitude, setStatusMessage)
  };
};
