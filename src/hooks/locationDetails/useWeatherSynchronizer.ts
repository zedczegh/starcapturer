
import { useCallback } from "react";

export const useWeatherSynchronizer = () => {
  // Synchronize weather data with forecast current data for consistency
  const syncWeatherWithForecast = useCallback((forecastData: any, locationData: any, setLocationData: (data: any) => void) => {
    if (!forecastData?.current || !locationData?.weatherData) return;
    
    try {
      const currentForecast = forecastData.current;
      const currentWeather = locationData.weatherData;
      
      // Only update if there's a significant difference
      const cloudDifference = Math.abs((currentForecast.cloud_cover || 0) - (currentWeather.cloudCover || 0));
      const tempDifference = Math.abs((currentForecast.temperature_2m || 0) - (currentWeather.temperature || 0));
      
      if (cloudDifference > 10 || tempDifference > 2) {
        console.log("Significant weather difference detected, syncing with forecast");
        
        const updatedWeather = {
          ...currentWeather,
          temperature: currentForecast.temperature_2m || currentWeather.temperature,
          humidity: currentForecast.relative_humidity_2m || currentWeather.humidity,
          cloudCover: currentForecast.cloud_cover || currentWeather.cloudCover,
          windSpeed: currentForecast.wind_speed_10m || currentWeather.windSpeed,
          precipitation: currentForecast.precipitation || currentWeather.precipitation,
          time: currentForecast.time || currentWeather.time
        };
        
        // If weather code is available, update condition
        if (currentForecast.weather_code !== undefined) {
          // Map weather code to condition text
          const weatherConditions: Record<number, string> = {
            0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle",
            53: "Moderate drizzle", 55: "Dense drizzle", 56: "Light freezing drizzle",
            57: "Dense freezing drizzle", 61: "Slight rain", 63: "Moderate rain",
            65: "Heavy rain", 66: "Light freezing rain", 67: "Heavy freezing rain",
            71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
            77: "Snow grains", 80: "Slight rain showers", 81: "Moderate rain showers",
            82: "Violent rain showers", 85: "Slight snow showers", 86: "Heavy snow showers",
            95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
          };
          
          updatedWeather.weatherCondition = weatherConditions[currentForecast.weather_code] || "";
          updatedWeather.condition = weatherConditions[currentForecast.weather_code] || 
                                    determineConditionFromCloudCover(updatedWeather.cloudCover);
        }
        
        // Update location data with synced weather
        setLocationData({
          ...locationData,
          weatherData: updatedWeather
        });
      }
    } catch (error) {
      console.error("Error syncing weather with forecast:", error);
    }
  }, []);
  
  // Determine condition from cloud cover when weather code isn't available
  const determineConditionFromCloudCover = (cloudCover: number): string => {
    if (cloudCover < 10) return "Clear";
    if (cloudCover < 30) return "Mostly Clear";
    if (cloudCover < 60) return "Partly Cloudy";
    if (cloudCover < 80) return "Mostly Cloudy";
    return "Overcast";
  };

  return { syncWeatherWithForecast };
};
