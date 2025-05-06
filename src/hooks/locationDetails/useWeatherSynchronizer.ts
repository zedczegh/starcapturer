
import { useCallback } from 'react';

export function useWeatherSynchronizer() {
  /**
   * Synchronizes weather data with forecast data to ensure consistency
   * This is helpful when weather API returns partial or invalid data
   */
  const syncWeatherWithForecast = useCallback((forecastData: any, locationData: any, setLocationData: (data: any) => void) => {
    if (!forecastData || !locationData || !forecastData.current || !locationData.weatherData) {
      return false;
    }

    // Check if we need to synchronize data (missing critical weather fields)
    const needsSync = 
      !locationData.weatherData.temperature ||
      !locationData.weatherData.humidity ||
      !locationData.weatherData.cloudCover ||
      typeof locationData.weatherData.temperature !== 'number' ||
      typeof locationData.weatherData.humidity !== 'number' ||
      typeof locationData.weatherData.cloudCover !== 'number';

    if (needsSync) {
      console.log("Synchronizing weather data with forecast data");
      
      // Create improved weather data from forecast current conditions
      const improvedWeatherData = {
        ...locationData.weatherData,
        temperature: typeof forecastData.current.temperature_2m === 'number' 
          ? forecastData.current.temperature_2m 
          : locationData.weatherData.temperature || 15,
        humidity: typeof forecastData.current.relative_humidity_2m === 'number'
          ? forecastData.current.relative_humidity_2m
          : locationData.weatherData.humidity || 50,
        cloudCover: typeof forecastData.current.cloud_cover === 'number'
          ? forecastData.current.cloud_cover
          : locationData.weatherData.cloudCover || 30,
        windSpeed: typeof forecastData.current.wind_speed_10m === 'number'
          ? forecastData.current.wind_speed_10m
          : locationData.weatherData.windSpeed || 5,
        time: forecastData.current.time || new Date().toISOString(),
        condition: forecastData.current.condition || 'Clear',
        weatherCondition: forecastData.current.weather_code ? 
          getWeatherCondition(forecastData.current.weather_code) : 
          'Clear'
      };

      // Update location data with improved weather data
      setLocationData({
        ...locationData,
        weatherData: improvedWeatherData,
        lastSync: new Date().toISOString()
      });

      return true;
    }

    return false;
  }, []);

  return { syncWeatherWithForecast };
}

// Helper function to map weather codes to conditions
function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
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
  
  return conditions[code] || "Unknown";
}
