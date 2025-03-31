
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { fetchLongRangeForecastData } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export const useLongRangeForecast = (locationData: any) => {
  const [longRangeForecast, setLongRangeForecast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { t } = useLanguage();

  // Use refs for controllers for better cleanup
  const controllerRef = useRef<AbortController | null>(null);
  
  // Add timeout ref for throttling
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up function to abort ongoing requests
  const cleanupRequest = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);
  
  // Cleanup timeout function
  const cleanupTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const loadLongRangeForecast = useCallback(async (force: boolean = false) => {
    if (!locationData || !locationData.latitude || !locationData.longitude) {
      return;
    }
    
    // Create a cache key based on coordinates
    const cacheKey = `long-range-forecast-${locationData.latitude.toFixed(4)}-${locationData.longitude.toFixed(4)}`;
    
    // Check cache first if not forcing refresh
    if (!force) {
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          // Use cache if less than 2 hours old
          if (Date.now() - timestamp < 2 * 60 * 60 * 1000) {
            console.log("Using cached long-range forecast data");
            setLongRangeForecast(data);
            return;
          }
        }
      } catch (error) {
        console.error("Error retrieving cached long-range forecast:", error);
      }
    }
    
    try {
      // Prevent duplicate requests within a short timeframe
      cleanupTimeout();
      
      setIsLoading(true);
      
      // Cancel any ongoing requests
      cleanupRequest();
      
      // Create a new AbortController
      controllerRef.current = new AbortController();
      
      const data = await fetchLongRangeForecastData({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        days: 16
      }, controllerRef.current.signal);
      
      setLongRangeForecast(data);
      
      // Cache the data
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error("Error caching long-range forecast data:", error);
      }
      
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error("Error fetching long range forecast data:", error);
        toast.error(t("Failed to fetch long range forecast data", "获取长期预报数据失败"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [locationData, t, cleanupRequest, cleanupTimeout]);

  // Load long-range forecast when location changes
  useEffect(() => {
    if (locationData?.latitude && locationData?.longitude) {
      loadLongRangeForecast();
    }
    
    // Clean up on unmount
    return () => {
      cleanupRequest();
      cleanupTimeout();
    };
  }, [locationData?.latitude, locationData?.longitude, loadLongRangeForecast, cleanupRequest, cleanupTimeout]);

  return {
    longRangeForecast,
    loadLongRangeForecast,
    isLoading
  };
};
