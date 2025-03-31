
import { useState, useEffect } from 'react';
import { fetchWeatherData } from '@/lib/api';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

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
        
        const weatherData = await fetchWeatherData({
          latitude,
          longitude
        });

        if (!weatherData || !weatherData.daily) {
          throw new Error('Failed to fetch forecast data');
        }

        const dailyForecasts = Array.isArray(weatherData.daily) 
          ? weatherData.daily 
          : [];

        setForecast({
          daily: dailyForecasts.map(day => ({
            time: day.time,
            weatherCode: day.weatherCode,
            temperatureMax: day.temperatureMax,
            temperatureMin: day.temperatureMin,
            sunrise: day.sunrise,
            sunset: day.sunset,
            precipitation: day.precipitation,
            cloudCover: day.cloudCover,
            windSpeed: day.windSpeed,
            visibility: day.visibility || 0
          })),
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
