
import { useCallback } from "react";
import { validateWeatherAgainstForecast } from "@/utils/validation/dataValidation";

export const useWeatherSynchronizer = () => {
  // Synchronize weather data with forecast current data for consistency
  const syncWeatherWithForecast = useCallback((forecastData: any, locationData: any, setLocationData: (data: any) => void) => {
    if (!forecastData?.current || !locationData?.weatherData) return false;
    
    try {
      // Use the validation utility to check for discrepancies
      const { isValid, correctedData, discrepancies } = validateWeatherAgainstForecast(
        locationData.weatherData,
        forecastData
      );
      
      if (!isValid && correctedData) {
        console.log("Weather data discrepancies detected:", discrepancies);
        
        // Update location data with corrected weather data
        setLocationData({
          ...locationData,
          weatherData: correctedData,
          _lastSyncTime: new Date().toISOString() // Add timestamp for tracking
        });
        
        return true;
      }
    } catch (error) {
      console.error("Error syncing weather with forecast:", error);
    }
    
    return false;
  }, []);
  
  // Determine condition from cloud cover when weather code isn't available
  const determineConditionFromCloudCover = useCallback((cloudCover: number): string => {
    if (typeof cloudCover !== 'number' || isNaN(cloudCover)) {
      return "Unknown";
    }
    
    if (cloudCover < 10) return "Clear";
    if (cloudCover < 30) return "Mostly Clear";
    if (cloudCover < 60) return "Partly Cloudy";
    if (cloudCover < 80) return "Mostly Cloudy";
    return "Overcast";
  }, []);

  // Comprehensive validation of weather data
  const validateWeatherData = useCallback((weatherData: any): any => {
    if (!weatherData) return null;
    
    const validatedData = { ...weatherData };
    
    // Ensure critical fields exist and are valid
    if (typeof validatedData.temperature !== 'number' || isNaN(validatedData.temperature)) {
      validatedData.temperature = 15; // Default temperature
    }
    
    if (typeof validatedData.humidity !== 'number' || isNaN(validatedData.humidity)) {
      validatedData.humidity = 50; // Default humidity
    }
    
    if (typeof validatedData.cloudCover !== 'number' || isNaN(validatedData.cloudCover)) {
      validatedData.cloudCover = 30; // Default cloud cover
    }
    
    if (typeof validatedData.windSpeed !== 'number' || isNaN(validatedData.windSpeed)) {
      validatedData.windSpeed = 5; // Default wind speed
    }
    
    // Set conditions based on cloud cover if missing
    if (!validatedData.condition) {
      validatedData.condition = determineConditionFromCloudCover(validatedData.cloudCover);
    }
    
    // Ensure time exists
    if (!validatedData.time) {
      validatedData.time = new Date().toISOString();
    }
    
    return validatedData;
  }, [determineConditionFromCloudCover]);

  return { 
    syncWeatherWithForecast,
    determineConditionFromCloudCover,
    validateWeatherData
  };
};
