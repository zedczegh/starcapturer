
import { useCallback } from "react";
import { synchronizeWeatherWithForecast } from "@/utils/validation/weatherDataSync";

export const useWeatherSynchronizer = () => {
  // Synchronize weather data with forecast current data for consistency
  const syncWeatherWithForecast = useCallback((forecastData: any, locationData: any, setLocationData: (data: any) => void) => {
    if (!forecastData || !locationData?.weatherData) return false;
    
    try {
      // Use the enhanced synchronization utility
      const { updatedData, wasUpdated } = synchronizeWeatherWithForecast(
        locationData.weatherData,
        forecastData
      );
      
      if (wasUpdated) {
        // Update location data with corrected weather data
        setLocationData({
          ...locationData,
          weatherData: updatedData
        });
        
        return true;
      }
    } catch (error) {
      console.error("Error syncing weather with forecast:", error);
    }
    
    return false;
  }, []);

  return { syncWeatherWithForecast };
};
