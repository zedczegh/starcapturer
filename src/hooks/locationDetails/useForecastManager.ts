
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
  
  // Process forecast data to detect extreme weather conditions
  const weatherAlerts = useMemo(() => {
    if (!forecastData || !forecastData.hourly) return [];
    
    // Convert forecast data to the format expected by detectExtremeWeatherConditions
    const forecasts = [];
    for (let i = 0; i < forecastData.hourly.time.length; i++) {
      forecasts.push({
        time: forecastData.hourly.time[i],
        weatherCode: forecastData.hourly.weather_code?.[i],
        windSpeed: forecastData.hourly.wind_speed_10m?.[i],
        precipitation: forecastData.hourly.precipitation?.[i]
      });
    }
    
    return detectExtremeWeatherConditions(forecasts, t);
  }, [forecastData, t]);

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
    nightForecast,
    weatherAlerts,
    setForecastData,
    handleRefreshForecast: (latitude: number, longitude: number) => 
      handleRefreshForecast(latitude, longitude),
    handleRefreshLongRangeForecast: (latitude: number, longitude: number) => 
      handleRefreshLongRangeForecast(latitude, longitude)
  };
};
