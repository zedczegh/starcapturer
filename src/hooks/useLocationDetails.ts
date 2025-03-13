
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWeatherData, fetchForecastData, fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export const useLocationDetails = (locationData: any, setLocationData: (data: any) => void) => {
  const navigate = useNavigate();
  const [forecastData, setForecastData] = useState(null);
  const [longRangeForecast, setLongRangeForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [longRangeLoading, setLongRangeLoading] = useState(false);
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (locationData) {
      fetchLocationForecast();
      fetchLongRangeForecast();
      updateLightPollutionData();
    }
  }, [locationData]);

  const handleRefreshAll = async () => {
    if (!locationData) return;
    
    setLoading(true);
    setStatusMessage(t("Updating all information...", "正在更新所有信息..."));

    try {
      const newWeatherData = await fetchWeatherData({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });

      if (!newWeatherData) throw new Error("Failed to fetch weather data");

      let bortleScale = locationData.bortleScale;
      try {
        const bortleData = await fetchLightPollutionData(locationData.latitude, locationData.longitude);
        if (bortleData?.bortleScale) {
          bortleScale = bortleData.bortleScale;
        }
      } catch (error) {
        console.error("Error fetching light pollution data:", error);
        // Continue with existing bortle scale
      }

      const siqsResult = calculateSIQS({
        cloudCover: newWeatherData.cloudCover,
        bortleScale: bortleScale,
        seeingConditions: locationData.seeingConditions || 3,
        windSpeed: newWeatherData.windSpeed,
        humidity: newWeatherData.humidity,
        moonPhase: locationData.moonPhase,
        aqi: newWeatherData.aqi,
        weatherCondition: newWeatherData.weatherCondition,
        precipitation: newWeatherData.precipitation
      });

      const updatedLocationData = {
        ...locationData,
        weatherData: newWeatherData,
        bortleScale,
        siqsResult,
        timestamp: new Date().toISOString()
      };

      setLocationData(updatedLocationData);
      
      fetchLocationForecast();
      fetchLongRangeForecast();

      setStatusMessage(t("All information has been updated with the latest data.", 
                      "所有信息都已使用最新数据更新。"));
      
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setStatusMessage(t("Could not update all information. Please try again later.", 
                     "无法更新所有信息。请稍后再试。"));
    } finally {
      setLoading(false);
    }
  };

  const updateLightPollutionData = async () => {
    if (!locationData) return;
    
    try {
      const bortleData = await fetchLightPollutionData(locationData.latitude, locationData.longitude);
      
      if (bortleData && bortleData.bortleScale !== locationData.bortleScale) {
        const updatedLocationData = {
          ...locationData,
          bortleScale: bortleData.bortleScale
        };
        
        const moonPhase = locationData.moonPhase || 0;
        const siqsResult = calculateSIQS({
          cloudCover: locationData.weatherData.cloudCover,
          bortleScale: bortleData.bortleScale,
          seeingConditions: locationData.seeingConditions || 3,
          windSpeed: locationData.weatherData.windSpeed,
          humidity: locationData.weatherData.humidity,
          moonPhase,
          precipitation: locationData.weatherData.precipitation,
          weatherCondition: locationData.weatherData.weatherCondition,
          aqi: locationData.weatherData.aqi
        });
        
        setLocationData({
          ...updatedLocationData,
          siqsResult
        });
      }
    } catch (error) {
      console.error("Error updating light pollution data:", error);
      // Silent failure for light pollution updates - use existing data
    }
  };

  const fetchLocationForecast = async () => {
    if (!locationData) return;
    
    setForecastLoading(true);
    try {
      const forecast = await fetchForecastData({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });
      
      setForecastData(forecast);
      if (!forecast) {
        console.error("Forecast data not available or incomplete");
        setStatusMessage(t("Could not load weather forecast. Try refreshing.", 
                        "无法加载天气预报。请尝试刷新。"));
        
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
      setStatusMessage(t("Could not load weather forecast. Try refreshing.", 
                      "无法加载天气预报。请尝试刷新。"));
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchLongRangeForecast = async () => {
    if (!locationData) return;
    
    setLongRangeLoading(true);
    try {
      const forecast = await fetchForecastData({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        days: 16 // Request 16 days including today
      });
      
      setLongRangeForecast(forecast);
      if (!forecast) {
        console.error("Long range forecast data not available or incomplete");
      }
    } catch (error) {
      console.error("Error fetching long range forecast:", error);
      setStatusMessage(t("Could not load extended forecast. Try refreshing.", 
                      "无法加载延��天气预报。请尝试刷新。"));
    } finally {
      setLongRangeLoading(false);
    }
  };

  const handleRefreshLongRangeForecast = () => {
    fetchLongRangeForecast();
    setStatusMessage(t("Updating 15-day forecast data...", "正在更新15天预报数据..."));
    
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRefreshForecast = () => {
    fetchLocationForecast();
    setStatusMessage(t("Updating weather forecast data...", "正在更新天气预报数据..."));
    
    setTimeout(() => setStatusMessage(null), 3000);
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
    // Added these state setters to fix the build errors
    setLoading,
    setForecastData
  };
};
