
import { useEffect, useCallback, useRef, useState } from 'react';
import { fetchForecastData } from '@/lib/api/forecast';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook to load forecast data for a location and ensure it's up to date
 * Handles loading, caching, and error states
 */
export const useForecastDataLoader = (
  locationData: any,
  setLocationData: (data: any) => void
) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const lastLoadTimeRef = useRef<Record<string, number>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Load forecast data for a location
  const loadForecastData = useCallback(async (force = false) => {
    if (!locationData?.latitude || !locationData?.longitude) {
      return;
    }
    
    // Create a location key for caching
    const locationKey = `${locationData.latitude.toFixed(3)},${locationData.longitude.toFixed(3)}`;
    
    // Only refresh if it's been more than 15 minutes or force is true
    const now = Date.now();
    if (!force && lastLoadTimeRef.current[locationKey] && 
        now - lastLoadTimeRef.current[locationKey] < 15 * 60 * 1000) {
      console.log("Skipping forecast refresh - less than 15 minutes since last update");
      return;
    }
    
    // Cancel any in-progress requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    
    try {
      console.log(`Loading forecast data for ${locationData.name}`);
      const forecastData = await fetchForecastData(
        {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          days: 3
        }, 
        abortControllerRef.current.signal
      );
      
      if (forecastData && forecastData.hourly) {
        console.log("Forecast data loaded successfully");
        
        // Update the location data with forecast data
        setLocationData({
          ...locationData,
          forecastData
        });
        
        // Update last load time
        lastLoadTimeRef.current[locationKey] = now;
      } else {
        console.error("Failed to load forecast data - API returned no data");
        toast.error(t("Failed to load forecast data"));
      }
    } catch (error: any) {
      // Don't show errors for aborted requests
      if (error.name !== 'AbortError') {
        console.error("Error loading forecast data:", error);
        toast.error(t("Failed to load forecast data"));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [locationData?.latitude, locationData?.longitude, locationData?.name, setLocationData, t]);
  
  // Auto-load forecast data when location changes
  useEffect(() => {
    if (locationData?.latitude && locationData?.longitude) {
      loadForecastData();
    }
    
    return () => {
      // Cancel any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [locationData?.latitude, locationData?.longitude, loadForecastData]);
  
  return {
    loadForecastData,
    isLoading
  };
};
