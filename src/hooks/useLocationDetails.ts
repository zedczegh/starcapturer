import { useState, useEffect } from 'react';
import { formatTime, formatDayMonth } from '@/components/forecast/ForecastUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchForecast } from '@/hooks/siqs/forecastFetcher';

import { useForecastManager } from "./locationDetails/useForecastManager";
import { useWeatherUpdater } from "./useWeatherUpdater";
import { clearForecastCache } from "./siqs/forecastFetcher";
import { calculateNighttimeSIQS } from "@/utils/nighttimeSIQS";

export const useLocationDetails = (locationData: any, setLocationData: (data: any) => void) => {
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const initialLoadCompleteRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const siqsUpdatedRef = useRef<boolean>(false);
  const dataSyncTimerRef = useRef<number | null>(null);
  
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

  useEffect(() => {
    if (!locationData) return;
    
    const currentLocation = `${locationData.latitude?.toFixed(4)}-${locationData.longitude?.toFixed(4)}`;
    
    if (lastLocationRef.current && lastLocationRef.current !== currentLocation) {
      console.log("Location changed, clearing forecast cache");
      clearForecastCache(); // Clear cache when location changes
      initialLoadCompleteRef.current = false; // Reset to trigger a refresh
      siqsUpdatedRef.current = false; // Reset SIQS update flag
      
      if (dataSyncTimerRef.current) {
        window.clearTimeout(dataSyncTimerRef.current);
        dataSyncTimerRef.current = null;
      }
    }
    
    lastLocationRef.current = currentLocation;
  }, [locationData?.latitude, locationData?.longitude]);

  useEffect(() => {
    if (!initialLoadCompleteRef.current && locationData && 
        locationData.latitude && locationData.longitude) {
      
      const timer = setTimeout(() => {
        console.log("Auto-refreshing on initial load");
        handleRefreshAll();
        initialLoadCompleteRef.current = true;
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [locationData]);

  useEffect(() => {
    if (forecastData && !forecastLoading && locationData) {
      syncWeatherWithForecast();
      
      if (!siqsUpdatedRef.current) {
        console.log("Updating SIQS score with fresh forecast data");
        
        try {
          const updatedSIQS = calculateNighttimeSIQS(locationData, forecastData, null);
          
          if (updatedSIQS) {
            console.log("Nighttime SIQS calculated:", updatedSIQS.score);
            
            setLocationData({
              ...locationData,
              siqsResult: updatedSIQS
            });
            
            siqsUpdatedRef.current = true;
          } else if (locationData.weatherData) {
            const cloudCover = locationData.weatherData.cloudCover;
            if (cloudCover < 40) {
              const estimatedScore = Math.max(0, Math.min(10, 10 - (cloudCover * 0.25)));
              console.log("Using fallback SIQS based on current cloud cover:", estimatedScore);
              
              setLocationData({
                ...locationData,
                siqsResult: {
                  score: estimatedScore,
                  isViable: true,
                  factors: [
                    {
                      name: "Cloud Cover",
                      score: (100 - cloudCover * 2.5),
                      description: `Cloud cover of ${cloudCover}% is good for imaging`
                    }
                  ]
                }
              });
              
              siqsUpdatedRef.current = true;
            }
          }
        } catch (error) {
          console.error("Error updating SIQS with forecast data:", error);
        }
      }
    }
  }, [forecastData, forecastLoading, locationData, setLocationData]);

  const syncWeatherWithForecast = useCallback(() => {
    if (!forecastData?.current || !locationData?.weatherData) return;
    
    try {
      const currentForecast = forecastData.current;
      const currentWeather = locationData.weatherData;
      
      const cloudDifference = Math.abs((currentForecast.cloud_cover || 0) - (currentWeather.cloudCover || 0));
      const tempDifference = Math.abs((currentForecast.temperature_2m || 0) - (currentWeather.temperature || 0));
      
      if (cloudDifference > 10 || tempDifference > 2) {
        console.log("Significant weather difference detected, syncing with forecast");
        
        const updatedWeather = {
          ...currentWeather,
          temperature: currentForecast.temperature_2m || currentWeather.temperature,
          humidity: currentForecast.relative_humidity_2m || currentWeather.humidity,
          cloudCover: currentForecast.cloud_cover || currentWeather.cloudCover,
          windSpeed: currentForecast.wind_speed_10m || currentWeather.windSpeed,
          precipitation: currentForecast.precipitation || currentWeather.precipitation,
          time: currentForecast.time || currentWeather.time
        };
        
        if (currentForecast.weather_code !== undefined) {
          const weatherConditions: Record<number, string> = {
            0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle",
            53: "Moderate drizzle", 55: "Dense drizzle", 56: "Light freezing drizzle",
            57: "Dense freezing drizzle", 61: "Slight rain", 63: "Moderate rain",
            65: "Heavy rain", 66: "Light freezing rain", 67: "Heavy freezing rain",
            71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
            77: "Snow grains", 80: "Slight rain showers", 81: "Moderate rain showers",
            82: "Violent rain showers", 85: "Slight snow showers", 86: "Heavy snow showers",
            95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
          };
          
          updatedWeather.weatherCondition = weatherConditions[currentForecast.weather_code] || "";
          updatedWeather.condition = weatherConditions[currentForecast.weather_code] || 
                                    determineConditionFromCloudCover(updatedWeather.cloudCover);
        }
        
        setLocationData({
          ...locationData,
          weatherData: updatedWeather
        });
      }
    } catch (error) {
      console.error("Error syncing weather with forecast:", error);
    }
  }, [forecastData, locationData, setLocationData]);

  const determineConditionFromCloudCover = (cloudCover: number): string => {
    if (cloudCover < 10) return "Clear";
    if (cloudCover < 30) return "Mostly Clear";
    if (cloudCover < 60) return "Partly Cloudy";
    if (cloudCover < 80) return "Mostly Cloudy";
    return "Overcast";
  };

  const handleRefreshForecast = useCallback(() => {
    if (!locationData) return;
    
    siqsUpdatedRef.current = false;
    
    clearForecastCache(locationData.latitude, locationData.longitude);
    refreshForecast(locationData.latitude, locationData.longitude);
  }, [locationData, refreshForecast]);

  const handleRefreshLongRangeForecast = useCallback(() => {
    if (!locationData) return;
    refreshLongRange(locationData.latitude, locationData.longitude);
  }, [locationData, refreshLongRange]);
  
  const handleRefreshAll = useCallback(() => {
    if (!locationData) return;
    
    siqsUpdatedRef.current = false;
    
    const fetchBothForecasts = () => {
      handleRefreshForecast();
      handleRefreshLongRangeForecast();
    };
    
    refreshWeather(locationData, setLocationData, fetchBothForecasts, setStatusMessage);
    
    if (dataSyncTimerRef.current) {
      window.clearTimeout(dataSyncTimerRef.current);
    }
    
    dataSyncTimerRef.current = window.setTimeout(() => {
      syncWeatherWithForecast();
      dataSyncTimerRef.current = null;
    }, 5000);
  }, [locationData, setLocationData, refreshWeather, handleRefreshForecast, handleRefreshLongRangeForecast, setStatusMessage, syncWeatherWithForecast]);

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
