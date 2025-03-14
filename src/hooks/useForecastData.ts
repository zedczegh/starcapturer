
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { fetchForecastData, fetchLongRangeForecastData } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export const useForecastData = () => {
  const [forecastData, setForecastData] = useState<any>(null);
  const [longRangeForecast, setLongRangeForecast] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [longRangeLoading, setLongRangeLoading] = useState<boolean>(false);
  const { t } = useLanguage();

  // Use refs for controllers for better cleanup
  const forecastControllerRef = useRef<AbortController | null>(null);
  const longRangeControllerRef = useRef<AbortController | null>(null);

  // Clean up function to abort ongoing requests
  const cleanupRequest = useCallback((controllerRef: React.MutableRefObject<AbortController | null>) => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const fetchLocationForecast = useCallback(async (latitude: number, longitude: number) => {
    try {
      setForecastLoading(true);
      
      // Cancel any ongoing requests
      cleanupRequest(forecastControllerRef);
      
      // Create a new AbortController
      forecastControllerRef.current = new AbortController();
      
      const data = await fetchForecastData({
        latitude,
        longitude,
        days: 3
      }, forecastControllerRef.current.signal);
      
      setForecastData(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error("Error fetching forecast data:", error);
        toast.error(t("Failed to fetch forecast data", "获取预报数据失败"));
      }
    } finally {
      setForecastLoading(false);
    }
  }, [t, cleanupRequest]);

  const fetchLongRangeForecast = useCallback(async (latitude: number, longitude: number) => {
    try {
      setLongRangeLoading(true);
      
      // Cancel any ongoing requests
      cleanupRequest(longRangeControllerRef);
      
      // Create a new AbortController
      longRangeControllerRef.current = new AbortController();
      
      const data = await fetchLongRangeForecastData({
        latitude,
        longitude,
        days: 16
      }, longRangeControllerRef.current.signal);
      
      setLongRangeForecast(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error("Error fetching long range forecast data:", error);
        toast.error(t("Failed to fetch long range forecast data", "获取长期预报数据失败"));
      }
    } finally {
      setLongRangeLoading(false);
    }
  }, [t, cleanupRequest]);

  // Clean up on unmount
  const cleanupOnUnmount = useCallback(() => {
    cleanupRequest(forecastControllerRef);
    cleanupRequest(longRangeControllerRef);
  }, [cleanupRequest]);

  // Handle refresh functions
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
    handleRefreshLongRangeForecast,
    cleanupOnUnmount
  };
};
