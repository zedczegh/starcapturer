
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
    handleRefreshForecast: (latitude: number, longitude: number) => 
      handleRefreshForecast(latitude, longitude),
    handleRefreshLongRangeForecast: (latitude: number, longitude: number) => 
      handleRefreshLongRangeForecast(latitude, longitude)
  };
};
