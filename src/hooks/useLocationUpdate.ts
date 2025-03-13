
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWeatherData, fetchLightPollutionData, fetchForecastData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useLanguage } from "@/contexts/LanguageContext";

export const useLocationUpdate = (locationData: any, setLocationData: (data: any) => void) => {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLocationUpdate = async (newLocation: { name: string; latitude: number; longitude: number }) => {
    setLoading(true);
    try {
      const weatherData = await fetchWeatherData({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });

      if (!weatherData) {
        throw new Error("Failed to retrieve weather data for this location");
      }

      // Always fetch fresh Bortle scale data when location changes
      let bortleScale = 4; // Default value
      try {
        const bortleData = await fetchLightPollutionData(newLocation.latitude, newLocation.longitude);
        if (bortleData?.bortleScale) {
          console.log("Updated Bortle scale:", bortleData.bortleScale);
          bortleScale = bortleData.bortleScale;
        }
      } catch (lightError) {
        console.error("Error fetching light pollution data during location update:", lightError);
        // Continue with default or existing bortle scale
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

      let forecastData = null;
      try {
        forecastData = await fetchForecastData({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          days: 3
        });
      } catch (forecastError) {
        console.error("Error fetching forecast during location update:", forecastError);
        // Continue without setting forecast data
      }

      const newLocationId = Date.now().toString();
      
      navigate(`/location/${newLocationId}`, { 
        state: updatedLocationData,
        replace: true 
      });

      return { updatedLocationData, forecastData };
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    handleLocationUpdate
  };
};
