
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchWeatherData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useLightPollutionData } from "./useLightPollutionData";
import { hasProperty } from "@/types/weather-utils";

export const useLocationUpdate = (
  locationData: any,
  setLocationData: (data: any) => void
) => {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { updateLightPollutionData } = useLightPollutionData();

  const handleLocationUpdate = useCallback(
    async (newLocation: { name: string; latitude: number; longitude: number }) => {
      if (!newLocation) return;
      
      setLoading(true);
      
      try {
        // Get new weather data for the updated location
        let newWeatherData;
        try {
          newWeatherData = await fetchWeatherData({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          });
        } catch (error) {
          console.error("Error fetching weather data:", error);
          // If weather API fails, use default weather data
          newWeatherData = {
            temperature: 20,
            humidity: 50,
            cloudCover: 30,
            windSpeed: 5,
            precipitation: 0,
            weatherCondition: "Clear",
            time: new Date().toISOString(),
            aqi: 50
          };
        }
        
        // Reuse existing Bortle scale or get a new one
        let bortleScale = hasProperty(locationData, 'bortleScale') ? locationData.bortleScale : 4;
        try {
          const { fetchLightPollutionData } = await import("@/lib/api");
          const bortleData = await fetchLightPollutionData(
            newLocation.latitude, 
            newLocation.longitude
          );
          if (bortleData?.bortleScale) {
            bortleScale = bortleData.bortleScale;
          }
        } catch (error) {
          console.error("Error fetching light pollution data:", error);
          // Continue with existing bortle scale
        }
        
        // Calculate new SIQS score
        const seeingConditions = hasProperty(locationData, 'seeingConditions') ? locationData.seeingConditions : 3;
        
        const siqsResult = calculateSIQS({
          cloudCover: newWeatherData.cloudCover,
          bortleScale: bortleScale,
          seeingConditions: seeingConditions,
          windSpeed: newWeatherData.windSpeed,
          humidity: newWeatherData.humidity,
          moonPhase: locationData.moonPhase,
          aqi: newWeatherData.aqi,
          weatherCondition: newWeatherData.weatherCondition,
          precipitation: newWeatherData.precipitation
        });
        
        // Update location data with new information
        const updatedLocationData = {
          ...locationData,
          name: newLocation.name,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          weatherData: newWeatherData,
          bortleScale,
          siqsResult,
          timestamp: new Date().toISOString()
        };
        
        setLocationData(updatedLocationData);
        
        // Show success toast
        toast.success(t("Location updated successfully", "位置更新成功"));
        
        return updatedLocationData;
      } catch (error) {
        console.error("Error updating location:", error);
        toast.error(t("Failed to update location", "位置更新失败"));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [locationData, setLocationData, t]
  );

  return {
    loading,
    handleLocationUpdate
  };
};
