
import { useState, useEffect } from 'react';
import { fetchForecastData, fetchLongRangeForecastData } from '@/lib/api';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const useForecastDataLoader = (
  latitude: number | undefined, 
  longitude: number | undefined
) => {
  const { language } = useLanguage();
  const [forecastData, setForecastData] = useState<any | null>(null);
  const [longRangeForecastData, setLongRangeForecastData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadForecastData = async () => {
      if (latitude === undefined || longitude === undefined) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load both forecast data types in parallel
        const [forecast, longRangeForecast] = await Promise.all([
          fetchForecastData({ latitude, longitude }),
          fetchLongRangeForecastData({ latitude, longitude })
        ]);

        setForecastData(forecast);
        setLongRangeForecastData(longRangeForecast);
      } catch (err) {
        console.error('Error loading forecast data:', err);
        setError(err as Error);
        
        toast.error(
          language === 'en' ? 'Failed to load forecast data' : '加载预报数据失败',
          {
            description: language === 'en' 
              ? 'Please check your connection and try again' 
              : '请检查您的连接并重试'
          }
        );
      } finally {
        setLoading(false);
      }
    };

    loadForecastData();
  }, [latitude, longitude, language]);

  return { forecastData, longRangeForecastData, loading, error };
};
