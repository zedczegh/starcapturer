
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { fetchForecastData, fetchLongRangeForecastData } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCleanupUtils } from "./locationDetails/useCleanupUtils";
import { useNightForecastProcessor } from "./locationDetails/useNightForecastProcessor";

export const useForecastData = () => {
  const [forecastData, setForecastData] = useState<any>(null);
  const [longRangeForecast, setLongRangeForecast] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [longRangeLoading, setLongRangeLoading] = useState<boolean>(false);
  const [nightForecast, setNightForecast] = useState<any[]>([]);
  const { t } = useLanguage();

  // Use refs for controllers for better cleanup
  const forecastControllerRef = useRef<AbortController | null>(null);
  const longRangeControllerRef = useRef<AbortController | null>(null);
  
  // Add timeout refs for throttling
  const forecastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longRangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Import utility hooks
  const { cleanupRequest, cleanupTimeout } = useCleanupUtils();
  const { processNightForecast } = useNightForecastProcessor();

  // Enhanced fetch with caching consideration
  const fetchLocationForecast = useCallback(async (latitude: number, longitude: number) => {
    try {
      // Prevent duplicate requests within a short timeframe
      cleanupTimeout(forecastTimeoutRef);
      
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
      
      // Process and set night forecast data
      const nightData = processNightForecast(data);
      setNightForecast(nightData);
      
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error("Error fetching forecast data:", error);
        toast.error(t("Failed to fetch forecast data", "获取预报数据失败"));
      }
    } finally {
      setForecastLoading(false);
    }
  }, [t, cleanupRequest, cleanupTimeout, processNightForecast]);

  const fetchLongRangeForecast = useCallback(async (latitude: number, longitude: number) => {
    try {
      // Prevent duplicate requests within a short timeframe
      cleanupTimeout(longRangeTimeoutRef);
      
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
  }, [t, cleanupRequest, cleanupTimeout]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupRequest(forecastControllerRef);
      cleanupRequest(longRangeControllerRef);
      cleanupTimeout(forecastTimeoutRef);
      cleanupTimeout(longRangeTimeoutRef);
    };
  }, [cleanupRequest, cleanupTimeout]);

  // Throttled refresh functions to prevent API abuse
  const handleRefreshForecast = useCallback((latitude: number, longitude: number) => {
    cleanupTimeout(forecastTimeoutRef);
    
    forecastTimeoutRef.current = setTimeout(() => {
      fetchLocationForecast(latitude, longitude);
    }, 200);
  }, [fetchLocationForecast, cleanupTimeout]);

  const handleRefreshLongRangeForecast = useCallback((latitude: number, longitude: number) => {
    cleanupTimeout(longRangeTimeoutRef);
    
    longRangeTimeoutRef.current = setTimeout(() => {
      fetchLongRangeForecast(latitude, longitude);
    }, 200);
  }, [fetchLongRangeForecast, cleanupTimeout]);

  return {
    forecastData,
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    nightForecast,
    setForecastData,
    fetchLocationForecast,
    fetchLongRangeForecast,
    handleRefreshForecast,
    handleRefreshLongRangeForecast,
    cleanupOnUnmount: useCallback(() => {
      cleanupRequest(forecastControllerRef);
      cleanupRequest(longRangeControllerRef);
      cleanupTimeout(forecastTimeoutRef);
      cleanupTimeout(longRangeTimeoutRef);
    }, [cleanupRequest, cleanupTimeout])
  };
};
