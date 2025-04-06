
import { useState, useCallback, useRef } from 'react';
import { useBortleUpdater } from './location/useBortleUpdater';
import { useForecastData } from './useForecastData';
import { calculateSIQSWithWeatherData } from './siqs/siqsCalculationUtils';
import { extractNightForecasts } from '@/components/forecast/ForecastUtils';

/**
 * Hook for updating SIQS data based on location changes
 */
export function useLocationSIQSUpdater(
  locationData: any = null,
  forecastData: any = null,
  setLocationData: (data: any) => void = () => {},
  t: any = null
) {
  const [loading, setLoading] = useState(false);
  const { updateBortleScale } = useBortleUpdater();
  const { fetchLocationForecast } = useForecastData();
  const updateRequiredRef = useRef(true);
  
  /**
   * Reset update state to force recalculation
   */
  const resetUpdateState = useCallback(() => {
    updateRequiredRef.current = true;
    console.log("SIQS update state reset, will recalculate on next opportunity");
  }, []);
  
  /**
   * Update SIQS data for a location
   * @param latitude Location latitude
   * @param longitude Location longitude
   * @param locationName Location name
   * @param currentData Current location data
   * @returns Updated location data
   */
  const updateSIQSForLocation = useCallback(async (
    latitude: number,
    longitude: number,
    locationName: string,
    currentData: any
  ) => {
    if (!latitude || !longitude) return currentData;
    
    setLoading(true);
    
    try {
      // Get Bortle scale for location
      const bortleScale = await updateBortleScale(
        latitude, 
        longitude, 
        locationName,
        currentData?.bortleScale || null
      );
      
      // Get weather data
      let weatherData = currentData?.weatherData;
      if (!weatherData) {
        const { fetchWeatherData } = await import('@/lib/api/weather');
        weatherData = await fetchWeatherData({ latitude, longitude });
      }
      
      // Get forecast data for more accurate SIQS
      let forecast = forecastData || currentData?.forecastData;
      
      try {
        if (!forecast) {
          forecast = await fetchLocationForecast(
            latitude,
            longitude
          );
        }
      } catch (error) {
        console.error("Error fetching forecast data:", error);
      }
      
      // Extract night forecasts if available
      const nightForecast = forecast?.hourly ? 
        extractNightForecasts(forecast.hourly) : 
        undefined;
      
      // Get additional parameters
      const cloudCover = validateCloudCover(weatherData?.cloudCover);
      const seeingConditions = currentData?.seeingConditions || 3;
      const moonPhase = currentData?.moonPhase || 0.5;
      
      // Calculate SIQS using the improved utility function
      const siqsResult = await calculateSIQSWithWeatherData(
        weatherData,
        bortleScale || 5,
        seeingConditions,
        moonPhase,
        forecast
      );
      
      // Return updated data
      return {
        ...currentData,
        latitude,
        longitude,
        name: locationName,
        weatherData,
        forecastData: forecast,
        bortleScale,
        siqsResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error updating SIQS for location:", error);
      return currentData;
    } finally {
      setLoading(false);
    }
  }, [updateBortleScale, fetchLocationForecast, forecastData]);
  
  return {
    loading,
    updateSIQSForLocation,
    resetUpdateState
  };
}

/**
 * Validate cloud cover value
 * @param cloudCover Cloud cover value to validate
 * @returns Validated cloud cover value
 */
function validateCloudCover(cloudCover: any): number {
  if (typeof cloudCover === 'number' && isFinite(cloudCover)) {
    return Math.max(0, Math.min(100, cloudCover));
  }
  return 50; // Default fallback
}
