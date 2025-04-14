
/**
 * Specialized utility for synchronizing weather data with forecast data
 * with specific handling for nighttime cloud cover
 */
import { validateWeatherAgainstForecast } from './dataValidation';
import { extractNightForecasts, calculateAverageCloudCover } from '@/components/forecast/NightForecastUtils';

/**
 * Synchronize weather data with forecast, with special handling for nighttime clouds
 * @param weatherData Current weather data
 * @param forecastData Forecast data from API
 * @returns Updated weather data with synchronized values
 */
export const synchronizeWeatherWithForecast = (
  weatherData: any,
  forecastData: any
): { updatedData: any; wasUpdated: boolean; discrepancies?: string[] } => {
  if (!weatherData || !forecastData) {
    return { updatedData: weatherData, wasUpdated: false };
  }
  
  // First use the standard validation to sync main weather properties
  const { isValid, correctedData, discrepancies } = validateWeatherAgainstForecast(
    weatherData,
    forecastData
  );
  
  // Get base synchronized data
  let updatedData = isValid ? weatherData : (correctedData || weatherData);
  let wasUpdated = !isValid;
  let allDiscrepancies = discrepancies || [];
  
  // Add nighttime cloud data synchronization
  try {
    if (forecastData.hourly) {
      const nightForecasts = extractNightForecasts(forecastData.hourly);
      
      if (nightForecasts.length > 0) {
        const averageNightCloudCover = calculateAverageCloudCover(nightForecasts);
        
        // Split into evening and morning
        const eveningForecasts = nightForecasts.filter(forecast => {
          const hour = new Date(forecast.time).getHours();
          return hour >= 18 && hour <= 23;
        });
        
        const morningForecasts = nightForecasts.filter(forecast => {
          const hour = new Date(forecast.time).getHours();
          return hour >= 0 && hour < 8;
        });
        
        const eveningCloudCover = calculateAverageCloudCover(eveningForecasts);
        const morningCloudCover = calculateAverageCloudCover(morningForecasts);
        
        // Add nighttime cloud data to the weather data
        updatedData = {
          ...updatedData,
          nighttimeCloudData: {
            average: averageNightCloudCover,
            evening: eveningCloudCover,
            morning: morningCloudCover,
            lastUpdated: new Date().toISOString()
          }
        };
        
        wasUpdated = true;
        
        // Check if there's a significant discrepancy between current and nighttime clouds
        if (Math.abs(updatedData.cloudCover - averageNightCloudCover) > 20) {
          allDiscrepancies.push(`Current cloud cover (${updatedData.cloudCover}%) vs nighttime average (${averageNightCloudCover.toFixed(1)}%)`);
        }
      }
    }
  } catch (error) {
    console.error('Error synchronizing nighttime cloud data:', error);
  }
  
  return { updatedData, wasUpdated, discrepancies: allDiscrepancies.length > 0 ? allDiscrepancies : undefined };
};

/**
 * Check if nighttime cloud data is stale and needs refresh
 * @param nighttimeCloudData Current nighttime cloud data
 * @param maxAge Maximum age in milliseconds
 * @returns Boolean indicating if data needs refresh
 */
export const isNighttimeCloudDataStale = (
  nighttimeCloudData: any,
  maxAge: number = 30 * 60 * 1000 // 30 minutes by default
): boolean => {
  if (!nighttimeCloudData || !nighttimeCloudData.lastUpdated) return true;
  
  const lastUpdated = new Date(nighttimeCloudData.lastUpdated).getTime();
  const now = new Date().getTime();
  
  return (now - lastUpdated) > maxAge;
};
