
import { useCallback } from 'react';
import { extractFutureForecasts } from '@/components/forecast/ForecastUtils';

export const useNightForecastProcessor = () => {
  // Process forecast data to extract nighttime forecast (6 PM to 6 AM)
  const processNightForecast = useCallback((data: any) => {
    if (!data || !data.hourly) return [];
    
    const futureForecasts = extractFutureForecasts(data);
    
    // Filter for nighttime hours (6 PM to 6 AM)
    return futureForecasts.filter(item => {
      const date = new Date(item.time);
      const hour = date.getHours();
      return hour >= 18 || hour < 6;
    });
  }, []);
  
  return { processNightForecast };
};
