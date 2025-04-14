
import { useCallback } from "react";
import { validateWeatherAgainstForecast } from "@/utils/validation/dataValidation";

export const useWeatherSynchronizer = () => {
  // Synchronize weather data with forecast current data for consistency
  const syncWeatherWithForecast = useCallback((forecastData: any, locationData: any, setLocationData: (data: any) => void) => {
    if (!forecastData?.current || !locationData?.weatherData) return;
    
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
          weatherData: correctedData
        });
        
        return true;
      }
    } catch (error) {
      console.error("Error syncing weather with forecast:", error);
    }
    
    return false;
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
