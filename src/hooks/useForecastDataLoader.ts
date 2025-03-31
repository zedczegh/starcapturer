
import { useEffect, useCallback, useRef } from 'react';
import { fetchForecastData } from '@/lib/api';
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
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef<number | null>(null);
  
  // Load forecast data for a location
  const loadForecastData = useCallback(async () => {
    if (!locationData?.latitude || !locationData?.longitude || loadingRef.current) {
      return;
    }
    
    // Only refresh if it's been more than 10 minutes since the last load
    const now = Date.now();
    if (lastLoadTimeRef.current && now - lastLoadTimeRef.current < 10 * 60 * 1000) {
      console.log("Skipping forecast refresh - less than 10 minutes since last update");
      return;
    }
    
    loadingRef.current = true;
    
    try {
      console.log(`Loading forecast data for ${locationData.name}`);
      const forecastData = await fetchForecastData(locationData.latitude, locationData.longitude);
      
      if (forecastData && forecastData.hourly) {
        console.log("Forecast data loaded successfully");
        
        // Update the location data with forecast data
        setLocationData({
          ...locationData,
          forecastData
        });
        
        lastLoadTimeRef.current = now;
      } else {
        console.error("Failed to load forecast data - API returned no data");
      }
    } catch (error) {
      console.error("Error loading forecast data:", error);
      toast.error(t("Failed to load forecast data", "加载预报数据失败"));
    } finally {
      loadingRef.current = false;
    }
  }, [locationData?.latitude, locationData?.longitude, locationData?.name, setLocationData, t]);
  
  // Auto-load forecast data when location changes
  useEffect(() => {
    if (locationData?.latitude && locationData?.longitude) {
      loadForecastData();
    }
  }, [locationData?.latitude, locationData?.longitude, loadForecastData]);
  
  return {
    loadForecastData,
    isLoading: loadingRef.current
  };
};
