
import { useState } from "react";
import { fetchWeatherData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLightPollutionData } from "./useLightPollutionData";

export const useWeatherUpdater = () => {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { updateLightPollutionData } = useLightPollutionData();

  const handleRefreshAll = async (
    locationData: any,
    setLocationData: (data: any) => void,
    fetchForecasts: () => void,
    setStatusMessage: (message: string | null) => void
  ) => {
    if (!locationData) return;
    
    setLoading(true);
    setStatusMessage(t("Updating all information...", "正在更新所有信息..."));

    try {
      const newWeatherData = await fetchWeatherData({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });

      if (!newWeatherData) throw new Error("Failed to fetch weather data");

      let bortleScale = locationData.bortleScale;
      try {
        const { fetchLightPollutionData } = await import("@/lib/api");
        const bortleData = await fetchLightPollutionData(
          locationData.latitude, 
          locationData.longitude
        );
        if (bortleData?.bortleScale) {
          bortleScale = bortleData.bortleScale;
        }
      } catch (error) {
        console.error("Error fetching light pollution data:", error);
        // Continue with existing bortle scale
      }

      const siqsResult = calculateSIQS({
        cloudCover: newWeatherData.cloudCover,
        bortleScale: bortleScale,
        seeingConditions: locationData.seeingConditions || 3,
        windSpeed: newWeatherData.windSpeed,
        humidity: newWeatherData.humidity,
        moonPhase: locationData.moonPhase,
        aqi: newWeatherData.aqi,
        weatherCondition: newWeatherData.weatherCondition,
        precipitation: newWeatherData.precipitation
      });

      const updatedLocationData = {
        ...locationData,
        weatherData: newWeatherData,
        bortleScale,
        siqsResult,
        timestamp: new Date().toISOString()
      };

      setLocationData(updatedLocationData);
      
      fetchForecasts();

      setStatusMessage(t("All information has been updated with the latest data.", 
                      "所有信息都已使用最新数据更新。"));
      
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setStatusMessage(t("Could not update all information. Please try again later.", 
                     "无法更新所有信息。请稍后再试。"));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    handleRefreshAll,
    updateLightPollutionData
  };
};
