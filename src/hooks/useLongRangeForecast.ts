
import { useState, useEffect } from 'react';
import { fetchWeatherData } from '@/lib/api';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchLongRangeForecastData } from '@/lib/api/forecast';

interface DailyForecast {
  time: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  sunrise: string;
  sunset: string;
  precipitation: number;
  cloudCover: number;
  windSpeed: number;
  visibility: number;
}

interface LongRangeForecastData {
  daily: DailyForecast[];
  isLoading: boolean;
  error: string | null;
}

export function useLongRangeForecast(latitude?: number, longitude?: number) {
  const [forecast, setForecast] = useState<LongRangeForecastData>({
    daily: [],
    isLoading: true,
    error: null
  });
  const { language } = useLanguage();

  useEffect(() => {
    if (!latitude || !longitude) {
      setForecast(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchForecast = async () => {
      try {
        setForecast(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Use the correct forecast API function for long range data
        const forecastData = await fetchLongRangeForecastData({
          latitude,
          longitude,
          days: 16
        });

        // Check if forecast data is available
        if (!forecastData) {
          throw new Error('Failed to fetch forecast data');
        }

        // Extract daily forecasts from forecastData
        const dailyForecasts = forecastData.daily || {};
        
        // Process the daily data into our format
        const processedForecasts: DailyForecast[] = [];
        
        // Check if time array exists and use its length to process data
        if (Array.isArray(dailyForecasts.time)) {
          const daysCount = dailyForecasts.time.length;
          
          for (let i = 0; i < daysCount; i++) {
            processedForecasts.push({
              time: dailyForecasts.time[i] || new Date().toISOString(),
              weatherCode: dailyForecasts.weather_code?.[i] || 0,
              temperatureMax: dailyForecasts.temperature_2m_max?.[i] || 25,
              temperatureMin: dailyForecasts.temperature_2m_min?.[i] || 15,
              sunrise: dailyForecasts.sunrise?.[i] || '06:00',
              sunset: dailyForecasts.sunset?.[i] || '18:00',
              precipitation: dailyForecasts.precipitation_sum?.[i] || 0,
              cloudCover: dailyForecasts.cloud_cover_mean?.[i] || 0,
              windSpeed: dailyForecasts.wind_speed_10m_max?.[i] || 0,
              visibility: dailyForecasts.visibility?.[i] || 10
            });
          }
        }

        setForecast({
          daily: processedForecasts,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching long range forecast:', error);
        setForecast({
          daily: [],
          isLoading: false,
          error: 'Failed to load forecast data'
        });
        
        toast.error(
          language === 'en' 
            ? 'Failed to load forecast data' 
            : '加载预报数据失败',
          { description: language === 'en' ? 'Please try again later' : '请稍后再试' }
        );
      }
    };

    fetchForecast();
  }, [latitude, longitude, language]);

  return forecast;
}
