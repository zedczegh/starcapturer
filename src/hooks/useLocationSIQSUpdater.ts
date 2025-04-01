
import { useEffect, useRef, useCallback } from 'react';
import { calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';
import { toast } from 'sonner';

/**
 * Hook to update SIQS score based on forecast data, ensuring consistency
 * throughout the application
 */
export const useLocationSIQSUpdater = (
  locationData: any, 
  forecastData: any, 
  setLocationData: (data: any) => void,
  t: any
) => {
  const updateAttemptedRef = useRef(false);
  const forceUpdateRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const lastForecastTimestampRef = useRef<string | null>(null);
  
  // Reset update state for new calculations
  const resetUpdateState = useCallback(() => {
    updateAttemptedRef.current = false;
    forceUpdateRef.current = true;
    console.log("SIQS update state reset");
  }, []);
  
  // Update SIQS score when forecast data becomes available or changes
  useEffect(() => {
    // Track location changes to force recalculation
    const locationSignature = locationData ? 
      `${locationData.latitude?.toFixed(6)}-${locationData.longitude?.toFixed(6)}` : null;
    
    // Get forecast signature to detect actual data changes
    const forecastSignature = forecastData?.hourly?.time?.[0] || null;
    
    // Reset state when location changes
    if (locationSignature !== lastLocationRef.current) {
      console.log("Location changed, resetting SIQS update state");
      lastLocationRef.current = locationSignature;
      lastForecastTimestampRef.current = null; // Reset forecast timestamp
      resetUpdateState();
    }
    
    // Check if forecast data has actually changed
    const forecastChanged = forecastSignature !== lastForecastTimestampRef.current;
    if (forecastChanged && forecastSignature) {
      console.log("Forecast data changed, updating SIQS");
      lastForecastTimestampRef.current = forecastSignature;
      resetUpdateState();
    }
    
    // Only update SIQS when forecast data is available or on forced update
    const shouldUpdate = (
      forecastData?.hourly && 
      Array.isArray(forecastData.hourly.time) &&
      forecastData.hourly.time.length > 0 &&
      locationData &&
      (!updateAttemptedRef.current || forceUpdateRef.current)
    );
    
    if (shouldUpdate) {
      console.log("Updating SIQS based on hourly forecast data");
      forceUpdateRef.current = false;
      
      try {
        // Calculate new SIQS based on nighttime conditions
        const freshSIQSResult = calculateNighttimeSIQS(locationData, forecastData, t);
        
        if (freshSIQSResult) {
          console.log(`Updated SIQS score: ${freshSIQSResult.score.toFixed(2)}`);
          
          // Ensure weather data is synchronized with forecast data
          const syncedWeatherData = getSynchronizedWeatherData(locationData, forecastData);
          
          // Update the SIQS result with the fresh calculation and synced weather
          setLocationData({
            ...locationData,
            siqsResult: freshSIQSResult,
            weatherData: syncedWeatherData || locationData.weatherData
          });
          
          updateAttemptedRef.current = true;
        } else if (locationData.weatherData?.cloudCover !== undefined) {
          // Fallback to current weather if nighttime forecast is unavailable
          console.log("Using fallback SIQS calculation based on current weather");
          const currentCloudCover = locationData.weatherData.cloudCover;
          
          // Simplified SIQS formula based on cloud cover
          const estimatedScore = currentCloudCover <= 75 
            ? Math.max(0, Math.min(10, 10 - (currentCloudCover * 0.1))) 
            : 0;
          
          console.log(`Using current cloud cover (${currentCloudCover}%) for SIQS: ${estimatedScore.toFixed(2)}`);
          
          setLocationData({
            ...locationData,
            siqsResult: {
              score: estimatedScore,
              isViable: estimatedScore > 2,
              factors: [
                {
                  name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                  score: Math.round((100 - currentCloudCover) * 10) / 10,
                  description: t 
                    ? t(`Cloud cover of ${currentCloudCover}% affects imaging quality`, 
                      `${currentCloudCover}%的云量影响成像质量`) 
                    : `Cloud cover of ${currentCloudCover}% affects imaging quality`
                }
              ]
            }
          });
          
          updateAttemptedRef.current = true;
        }
      } catch (error) {
        console.error("Error updating SIQS with forecast data:", error);
        toast.error(t ? t("Error updating SIQS score", "更新SIQS评分时出错") : "Error updating SIQS score");
      }
    }
  }, [forecastData, locationData, setLocationData, t, resetUpdateState]);
  
  return { resetUpdateState };
};

/**
 * Synchronize weather data with current forecast data
 * to ensure consistency between current conditions and forecast
 */
function getSynchronizedWeatherData(locationData: any, forecastData: any): any | null {
  if (!forecastData?.current || !locationData?.weatherData) {
    return null;
  }
  
  try {
    const currentForecast = forecastData.current;
    const currentWeather = locationData.weatherData;
    
    // Validate forecast data first to avoid bad updates
    if (
      typeof currentForecast.temperature_2m !== 'number' ||
      typeof currentForecast.relative_humidity_2m !== 'number' ||
      typeof currentForecast.cloud_cover !== 'number' ||
      typeof currentForecast.wind_speed_10m !== 'number'
    ) {
      console.warn("Invalid forecast data detected, keeping original weather data");
      return null;
    }
    
    // Preserve original data for fields not in forecast
    const preservedData = {
      condition: currentWeather.condition,
      aqi: currentWeather.aqi,
      time: currentForecast.time || currentWeather.time
    };
    
    // Get the most recent and accurate data
    return {
      ...currentWeather, // Keep all original fields
      // Override with validated forecast data
      temperature: currentForecast.temperature_2m,
      humidity: currentForecast.relative_humidity_2m,
      cloudCover: currentForecast.cloud_cover,
      windSpeed: currentForecast.wind_speed_10m,
      precipitation: currentForecast.precipitation || currentWeather.precipitation,
      // Preserve high-quality data from the original weather
      ...preservedData,
      // Add weather condition description from code if available
      weatherCondition: getWeatherCondition(currentForecast.weather_code, null) || currentWeather.weatherCondition
    };
  } catch (error) {
    console.error("Error synchronizing weather data:", error);
    return null;
  }
}

/**
 * Get a weather condition description from a weather code or cloud cover
 */
function getWeatherCondition(weatherCode: number | undefined, cloudCover: number | undefined): string | null {
  // Map of weather codes to descriptions
  const weatherDescriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  
  // If we have a weather code, use that
  if (weatherCode !== undefined && weatherDescriptions[weatherCode]) {
    return weatherDescriptions[weatherCode];
  }
  
  // Fallback to cloud cover based description
  if (cloudCover !== undefined) {
    if (cloudCover < 10) return "Clear";
    if (cloudCover < 30) return "Mostly Clear";
    if (cloudCover < 60) return "Partly Cloudy";
    if (cloudCover < 80) return "Mostly Cloudy";
    return "Overcast";
  }
  
  return null;
}
