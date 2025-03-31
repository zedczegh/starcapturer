
import { useState, useCallback } from 'react';
import { fetchLongRangeForecastData } from '@/lib/api/forecast';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook to load and manage long range forecast data
 */
export const useLongRangeForecast = (locationData: any) => {
  const { t } = useLanguage();
  const [longRangeForecast, setLongRangeForecast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load long range forecast data
  const loadLongRangeForecast = useCallback(async (force = false) => {
    if (!locationData?.latitude || !locationData?.longitude) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Loading long range forecast for ${locationData.name}`);
      const forecastData = await fetchLongRangeForecastData({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        days: 10
      });
      
      if (forecastData) {
        console.log("Long range forecast loaded successfully");
        setLongRangeForecast(forecastData);
      } else {
        console.error("Failed to load long range forecast - API returned no data");
        toast.error(t("Failed to load long range forecast"));
      }
    } catch (error: any) {
      console.error("Error loading long range forecast:", error);
      toast.error(t("Failed to load long range forecast"));
    } finally {
      setIsLoading(false);
    }
  }, [locationData?.latitude, locationData?.longitude, locationData?.name, t]);
  
  return {
    longRangeForecast,
    loadLongRangeForecast,
    isLoading
  };
};
