
import { useState, useEffect, useMemo } from "react";
import { useForecastData } from "../useForecastData";
import { detectExtremeWeatherConditions } from "@/components/forecast/ForecastUtils";
import { useLanguage } from "@/contexts/LanguageContext";

export const useForecastManager = (locationData: any) => {
  const { t } = useLanguage();
  const { 
    forecastData, 
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    nightForecast,
    setForecastData,
    fetchLocationForecast,
    fetchLongRangeForecast,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  } = useForecastData();
  
  // Memoized extreme weather detection with optimized performance
  const weatherAlerts = useMemo(() => {
    if (!forecastData || !forecastData.hourly) return [];
    
    // Get current time for filtering
    const now = new Date();
    
    // Convert forecast data to the format expected by detectExtremeWeatherConditions
    // Only include future forecasts (after current time)
    const forecasts = [];
    for (let i = 0; i < forecastData.hourly.time.length; i++) {
      const forecastTime = new Date(forecastData.hourly.time[i]);
      
      // Skip past forecasts
      if (forecastTime <= now) continue;
      
      forecasts.push({
        time: forecastData.hourly.time[i],
        weatherCode: forecastData.hourly.weather_code?.[i],
        windSpeed: forecastData.hourly.wind_speed_10m?.[i],
        precipitation: forecastData.hourly.precipitation?.[i]
      });
    }
    
    return detectExtremeWeatherConditions(forecasts, t);
  }, [forecastData, t]);

  // Fetch forecast data when location changes
  useEffect(() => {
    if (locationData && locationData.latitude && locationData.longitude) {
      fetchLocationForecast(locationData.latitude, locationData.longitude);
      fetchLongRangeForecast(locationData.latitude, locationData.longitude);
    }
  }, [locationData?.latitude, locationData?.longitude, fetchLocationForecast, fetchLongRangeForecast]);

  return {
    forecastData, 
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    nightForecast,
    weatherAlerts,
    setForecastData,
    handleRefreshForecast: (latitude: number, longitude: number) => 
      handleRefreshForecast(latitude, longitude),
    handleRefreshLongRangeForecast: (latitude: number, longitude: number) => 
      handleRefreshLongRangeForecast(latitude, longitude)
  };
};
