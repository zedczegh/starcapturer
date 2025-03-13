
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { fetchForecastData, fetchLongRangeForecastData } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export const useForecastData = () => {
  const [forecastData, setForecastData] = useState<any>(null);
  const [longRangeForecast, setLongRangeForecast] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [longRangeLoading, setLongRangeLoading] = useState<boolean>(false);
  const { t } = useLanguage();

  // Create AbortController refs
  let forecastController: AbortController | null = null;
  let longRangeController: AbortController | null = null;

  const fetchLocationForecast = useCallback(async (latitude: number, longitude: number) => {
    try {
      setForecastLoading(true);
      
      // Cancel any ongoing requests
      if (forecastController) {
        forecastController.abort();
      }
      
      // Create a new AbortController
      forecastController = new AbortController();
      
      const data = await fetchForecastData(latitude, longitude, forecastController.signal);
      setForecastData(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error("Error fetching forecast data:", error);
        toast.error(t("Failed to fetch forecast data", "获取预报数据失败"));
      }
    } finally {
      setForecastLoading(false);
    }
  }, [t]);

  const fetchLongRangeForecast = useCallback(async (latitude: number, longitude: number) => {
    try {
      setLongRangeLoading(true);
      
      // Cancel any ongoing requests
      if (longRangeController) {
        longRangeController.abort();
      }
      
      // Create a new AbortController
      longRangeController = new AbortController();
      
      const data = await fetchLongRangeForecastData(latitude, longitude, longRangeController.signal);
      setLongRangeForecast(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error("Error fetching long range forecast data:", error);
        toast.error(t("Failed to fetch long range forecast data", "获取长期预报数据失败"));
      }
    } finally {
      setLongRangeLoading(false);
    }
  }, [t]);

  const handleRefreshForecast = useCallback((latitude: number, longitude: number) => {
    fetchLocationForecast(latitude, longitude);
  }, [fetchLocationForecast]);

  const handleRefreshLongRangeForecast = useCallback((latitude: number, longitude: number) => {
    fetchLongRangeForecast(latitude, longitude);
  }, [fetchLongRangeForecast]);

  return {
    forecastData,
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    setForecastData,
    fetchLocationForecast,
    fetchLongRangeForecast,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  };
};
