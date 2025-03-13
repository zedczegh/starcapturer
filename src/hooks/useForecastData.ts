
import { useState } from "react";
import { fetchForecastData } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export const useForecastData = () => {
  const [forecastData, setForecastData] = useState(null);
  const [longRangeForecast, setLongRangeForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [longRangeLoading, setLongRangeLoading] = useState(false);
  const { t } = useLanguage();

  const fetchLocationForecast = async (latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => {
    if (!latitude || !longitude) return;
    
    setForecastLoading(true);
    try {
      const forecast = await fetchForecastData({
        latitude,
        longitude,
      });
      
      setForecastData(forecast);
      if (!forecast) {
        console.error("Forecast data not available or incomplete");
        setStatusMessage && setStatusMessage(t("Could not load weather forecast. Try refreshing.", 
                        "无法加载天气预报。请尝试刷新。"));
        
        setTimeout(() => setStatusMessage && setStatusMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
      setStatusMessage && setStatusMessage(t("Could not load weather forecast. Try refreshing.", 
                      "无法加载天气预报。请尝试刷新。"));
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchLongRangeForecast = async (latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => {
    if (!latitude || !longitude) return;
    
    setLongRangeLoading(true);
    try {
      const forecast = await fetchForecastData({
        latitude,
        longitude,
        days: 16 // Request 16 days including today
      });
      
      setLongRangeForecast(forecast);
      if (!forecast) {
        console.error("Long range forecast data not available or incomplete");
      }
    } catch (error) {
      console.error("Error fetching long range forecast:", error);
      setStatusMessage && setStatusMessage(t("Could not load extended forecast. Try refreshing.", 
                      "无法加载延长天气预报。请尝试刷新。"));
    } finally {
      setLongRangeLoading(false);
    }
  };

  const handleRefreshForecast = (latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => {
    fetchLocationForecast(latitude, longitude, setStatusMessage);
    setStatusMessage && setStatusMessage(t("Updating weather forecast data...", "正在更新天气预报数据..."));
    
    setTimeout(() => setStatusMessage && setStatusMessage(null), 3000);
  };

  const handleRefreshLongRangeForecast = (latitude: number, longitude: number, setStatusMessage?: (message: string | null) => void) => {
    fetchLongRangeForecast(latitude, longitude, setStatusMessage);
    setStatusMessage && setStatusMessage(t("Updating 15-day forecast data...", "正在更新15天预报数据..."));
    
    setTimeout(() => setStatusMessage && setStatusMessage(null), 3000);
  };

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
