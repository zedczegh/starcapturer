
import React from "react";
import { useNavigate } from "react-router-dom";
import { getLocationNameFromCoordinates, fetchLightPollutionData, fetchForecastData } from "@/lib/api";
import { fetchWeatherData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface LocationActionsProps {
  locationData: any;
  setLocationData: (data: any) => void;
  setForecastData: (data: any) => void;
  setLoading: (loading: boolean) => void;
  setStatusMessage: (message: string | null) => void;
  navigate: ReturnType<typeof useNavigate>;
}

export const LocationActions = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLocationUpdate = async (
    locationData: any,
    setLocationData: (data: any) => void,
    setForecastData: (data: any) => void,
    setLoading: (loading: boolean) => void,
    setStatusMessage: (message: string | null) => void
  ) => {
    if (!locationData) return;
    
    const newLocation = {
      name: locationData.name,
      latitude: locationData.latitude,
      longitude: locationData.longitude
    };

    setLoading(true);
    try {
      const weatherData = await fetchWeatherData({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });

      if (!weatherData) {
        throw new Error("Failed to retrieve weather data for this location");
      }

      let bortleScale = locationData?.bortleScale || 4;
      try {
        const bortleData = await fetchLightPollutionData(newLocation.latitude, newLocation.longitude);
        if (bortleData?.bortleScale) {
          bortleScale = bortleData.bortleScale;
        }
      } catch (lightError) {
        console.error("Error fetching light pollution data during location update:", lightError);
        // Continue with existing or default bortle scale
      }
      
      const moonPhase = locationData?.moonPhase || 0;
      
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale: bortleScale,
        seeingConditions: locationData?.seeingConditions || 3,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
        moonPhase,
        aqi: weatherData.aqi,
        weatherCondition: weatherData.weatherCondition,
        precipitation: weatherData.precipitation
      });

      const updatedLocationData = {
        ...locationData,
        ...newLocation,
        weatherData,
        bortleScale,
        siqsResult,
        timestamp: new Date().toISOString()
      };

      setLocationData(updatedLocationData);

      try {
        const forecast = await fetchForecastData({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          days: 3
        });
        
        setForecastData(forecast);
      } catch (forecastError) {
        console.error("Error fetching forecast during location update:", forecastError);
        // Continue without setting forecast data
      }

      const newLocationId = Date.now().toString();
      
      navigate(`/location/${newLocationId}`, { 
        state: updatedLocationData,
        replace: true 
      });

      setStatusMessage(t("SIQS score has been recalculated for the new location.", 
                    "已为新位置重新计算SIQS评分。"));
      
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t("Failed to update location and recalculate SIQS score. Please try again.", 
                    "无法更新位置并重新计算SIQS评分。请重试。"));
    } finally {
      setLoading(false);
    }
  };

  return {
    handleLocationUpdate
  };
};
