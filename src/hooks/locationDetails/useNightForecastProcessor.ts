
import { useCallback } from 'react';

export function useNightForecastProcessor() {
  // Process forecast data to extract nighttime values
  const processNightForecast = useCallback((forecastData: any) => {
    if (!forecastData || !forecastData.hourly || !forecastData.hourly.time) {
      return [];
    }
    
    try {
      const nightForecasts = [];
      const { hourly } = forecastData;
      
      // Process each forecast hour
      for (let i = 0; i < hourly.time.length; i++) {
        const time = new Date(hourly.time[i]);
        const hour = time.getHours();
        
        // Define nighttime as between 6 PM (18) and 7 AM (7)
        const isNight = hour >= 18 || hour < 7;
        
        if (isNight) {
          nightForecasts.push({
            time: hourly.time[i],
            cloudCover: hourly.cloud_cover?.[i] ?? null,
            temperature: hourly.temperature_2m?.[i] ?? null,
            humidity: hourly.relative_humidity_2m?.[i] ?? null,
            weatherCode: hourly.weather_code?.[i] ?? null,
            isNight: true
          });
        }
      }
      
      return nightForecasts;
    } catch (error) {
      console.error("Error processing night forecast:", error);
      return [];
    }
  }, []);
  
  return { processNightForecast };
}
