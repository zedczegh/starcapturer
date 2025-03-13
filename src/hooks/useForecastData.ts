
import { useState, useCallback, useRef } from "react";
import { fetchForecastData } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export const useForecastData = () => {
  const [forecastData, setForecastData] = useState(null);
  const [longRangeForecast, setLongRangeForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [longRangeLoading, setLongRangeLoading] = useState(false);
  const { t } = useLanguage();
  
  // Controller references to prevent race conditions
  const forecastControllerRef = useRef<AbortController | null>(null);
  const longRangeControllerRef = useRef<AbortController | null>(null);

  const fetchLocationForecast = useCallback(async (latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => {
    if (!latitude || !longitude) return;
    
    // Abort any previous request
    if (forecastControllerRef.current) {
      forecastControllerRef.current.abort();
    }
    
    // Create new controller
    forecastControllerRef.current = new AbortController();
    const signal = forecastControllerRef.current.signal;
    
    setForecastLoading(true);
    try {
      const forecast = await fetchForecastData({
        latitude,
        longitude,
      }, signal);
      
      // Only update if this is still the current request
      if (!signal.aborted) {
        setForecastData(forecast);
        if (!forecast) {
          console.error("Forecast data not available or incomplete");
          setStatusMessage && setStatusMessage(t("Could not load weather forecast. Try refreshing.", 
                          "无法加载天气预报。请尝试刷新。"));
          
          setTimeout(() => {
            if (setStatusMessage) setStatusMessage(null);
          }, 3000);
        }
      }
    } catch (error) {
      // Only handle errors if this is still the current request
      if (!signal.aborted) {
        console.error("Error fetching forecast:", error);
        setStatusMessage && setStatusMessage(t("Could not load weather forecast. Try refreshing.", 
                        "无法加载天气预报。请尝试刷新。"));
      }
    } finally {
      // Only update loading state if this is still the current request
      if (!signal.aborted) {
        setForecastLoading(false);
      }
    }
  }, [t]);

  const fetchLongRangeForecast = useCallback(async (latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => {
    if (!latitude || !longitude) return;
    
    // Abort any previous request
    if (longRangeControllerRef.current) {
      longRangeControllerRef.current.abort();
    }
    
    // Create new controller
    longRangeControllerRef.current = new AbortController();
    const signal = longRangeControllerRef.current.signal;
    
    setLongRangeLoading(true);
    try {
      const forecast = await fetchForecastData({
        latitude,
        longitude,
        days: 16 // Request 16 days including today
      }, signal);
      
      // Only update if this is still the current request
      if (!signal.aborted) {
        setLongRangeForecast(forecast);
        if (!forecast) {
          console.error("Long range forecast data not available or incomplete");
        }
      }
    } catch (error) {
      // Only handle errors if this is still the current request
      if (!signal.aborted) {
        console.error("Error fetching long range forecast:", error);
        setStatusMessage && setStatusMessage(t("Could not load extended forecast. Try refreshing.", 
                        "无法加载延长天气预报。请尝试刷新。"));
      }
    } finally {
      // Only update loading state if this is still the current request
      if (!signal.aborted) {
        setLongRangeLoading(false);
      }
    }
  }, [t]);

  const handleRefreshForecast = useCallback((latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => {
    fetchLocationForecast(latitude, longitude, setStatusMessage);
    setStatusMessage && setStatusMessage(t("Updating weather forecast data...", "正在更新天气预报数据..."));
    
    setTimeout(() => {
      if (setStatusMessage) setStatusMessage(null);
    }, 3000);
  }, [fetchLocationForecast, t]);

  const handleRefreshLongRangeForecast = useCallback((latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => {
    fetchLongRangeForecast(latitude, longitude, setStatusMessage);
    setStatusMessage && setStatusMessage(t("Updating 15-day forecast data...", "正在更新15天预报数据..."));
    
    setTimeout(() => {
      if (setStatusMessage) setStatusMessage(null);
    }, 3000);
  }, [fetchLongRangeForecast, t]);

  return {
    forecastData,
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    setForecastData,
    setLongRangeForecast,
    fetchLocationForecast,
    fetchLongRangeForecast,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  };
};
