
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

        // Check if weather data contains daily forecasts
        if (!weatherData || !weatherData.dailyForecasts) {
          throw new Error('Failed to fetch forecast data');
        }

        const dailyForecasts = Array.isArray(weatherData.dailyForecasts) 
          ? weatherData.dailyForecasts 
          : [];

        setForecast({
          daily: dailyForecasts.map(day => ({
            time: day.time || new Date().toISOString(),
            weatherCode: day.weatherCode || 0,
            temperatureMax: day.temperatureMax || 25,
            temperatureMin: day.temperatureMin || 15,
            sunrise: day.sunrise || '06:00',
            sunset: day.sunset || '18:00',
            precipitation: day.precipitation || 0,
            cloudCover: day.cloudCover || 0,
            windSpeed: day.windSpeed || 0,
            visibility: day.visibility || 10
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
