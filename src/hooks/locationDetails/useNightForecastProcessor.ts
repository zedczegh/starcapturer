
import { useCallback } from 'react';
import { extractFutureForecasts } from '@/components/forecast/ForecastUtils';

export const useNightForecastProcessor = () => {
  // Process forecast data to extract nighttime forecast for the next 24 hours (6 PM to 6 AM)
  const processNightForecast = useCallback((data: any) => {
    if (!data || !data.hourly) return [];
    
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Get forecasts for the next 24 hours
    const futureForecasts = extractFutureForecasts(data.hourly);
    
    // Filter for nighttime hours (6 PM to 6 AM) within the next 24 hours
    return futureForecasts.filter(item => {
      const date = new Date(item.time);
      if (date > twentyFourHoursLater) return false;
      
      const hour = date.getHours();
      return hour >= 18 || hour < 6;
    });
  }, []);
  
  return { processNightForecast };
};
