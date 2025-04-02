import { toast } from "sonner";
import { fetchWeatherData } from "@/lib/api/weather";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { saveLocationDetails } from "@/utils/locationStorage";
import { isValidAstronomyLocation } from "@/utils/locationValidator";

/**
 * Handle location change with validation and data refresh
 */
export const handleLocationChange = async (
  newLocation: { name: string; latitude: number; longitude: number },
  currentData: any,
  setLocationData: (data: any) => void,
  t: any,
  callbacks: {
    setLoading?: (loading: boolean) => void;
    setStatusMessage?: (message: string | null) => void;
    refreshForecast?: (lat: number, lng: number) => void;
    resetSiqsUpdate?: () => void;
  } = {}
) => {
  const {
    setLoading,
    setStatusMessage,
    refreshForecast,
    resetSiqsUpdate
  } = callbacks;
  
  // Start loading
  if (setLoading) setLoading(true);
  if (setStatusMessage) setStatusMessage(null);
  
  try {
    // Validate location is not on water
    if (!isValidAstronomyLocation(newLocation.latitude, newLocation.longitude, newLocation.name)) {
      toast.error(t ? t("Invalid location: appears to be on water", "无效位置：似乎在水上") : "Invalid location: appears to be on water");
      if (setLoading) setLoading(false);
      return Promise.reject(new Error("Invalid location"));
    }
    
    console.log(`Updating to new location: ${newLocation.name}`, newLocation);
    
    // Keep some existing data to prevent flickering during update
    const updatedData = {
      ...currentData,
      id: currentData.id,
      name: newLocation.name,
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      timestamp: new Date().toISOString(),
    };
    
    // Update location data with minimal info first for faster UI response
    setLocationData(updatedData);
    
    // Fetch weather data in parallel
    const weatherPromise = fetchWeatherData({
      latitude: newLocation.latitude,
      longitude: newLocation.longitude
    });
    
    // Fetch light pollution data in parallel
    const pollutionPromise = fetchLightPollutionData(
      newLocation.latitude,
      newLocation.longitude
    );
    
    // Wait for both to complete
    const [weatherData, pollutionData] = await Promise.all([
      weatherPromise,
      pollutionPromise
    ]);
    
    if (!weatherData) {
      throw new Error("Failed to fetch weather data");
    }
    
    // Calculate moon phase
    const moonPhase = calculateMoonPhase();
    
    // Extract Bortle scale data
    const bortleScale = pollutionData?.bortleScale || currentData.bortleScale || 5;
    
    // Default seeing conditions (will be updated with forecast data)
    const seeingConditions = 3;
    
    // Calculate initial SIQS with available data
    // This will be updated with forecast data later
    const initialSiqsResult = calculateSIQS({
      cloudCover: weatherData.cloudCover,
      bortleScale,
      seeingConditions,
      windSpeed: weatherData.windSpeed,
      humidity: weatherData.humidity,
      moonPhase,
      precipitation: weatherData.precipitation,
      weatherCondition: weatherData.condition,
      aqi: weatherData.aqi
    });
    
    // Prepare the complete updated data
    const completeUpdatedData = {
      ...updatedData,
      weatherData,
      bortleScale,
      moonPhase,
      seeingConditions,
      siqsResult: initialSiqsResult,
      timestamp: new Date().toISOString(),
    };
    
    // Update with complete data
    setLocationData(completeUpdatedData);
    
    // Persist to localStorage
    if (currentData.id) {
      saveLocationDetails(currentData.id, completeUpdatedData);
    }
    
    // Refresh forecast data with new location
    if (refreshForecast) {
      refreshForecast(newLocation.latitude, newLocation.longitude);
    }
    
    // Reset SIQS update state to force recalculation with new forecast
    if (resetSiqsUpdate) {
      resetSiqsUpdate();
    }
    
    // Show success message
    if (setStatusMessage) {
      setStatusMessage(t
        ? t("Location updated successfully", "位置已成功更新")
        : "Location updated successfully");
    }
    
    // Complete loading
    if (setLoading) setLoading(false);
    
    return Promise.resolve(completeUpdatedData);
  } catch (error) {
    console.error("Error updating location:", error);
    
    // Show error message
    toast.error(t
      ? t("Failed to update location. Please try again.", "无法更新位置。请重试。")
      : "Failed to update location. Please try again."
    );
    
    // Complete loading
    if (setLoading) setLoading(false);
    
    return Promise.reject(error);
  }
};
