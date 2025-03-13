
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWeatherData, fetchLightPollutionData, fetchForecastData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";

export const useLocationUpdate = (locationData: any, setLocationData: (data: any) => void) => {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLocationUpdate = useCallback(async (newLocation: { 
    name: string; 
    latitude: number; 
    longitude: number;
  }) => {
    setLoading(true);
    
    try {
      // Generate cache keys for React Query
      const latKey = newLocation.latitude.toFixed(4);
      const lngKey = newLocation.longitude.toFixed(4);
      const weatherKey = ['weather', latKey, lngKey];
      
      // Try to get cached data first
      let weatherData = queryClient.getQueryData(weatherKey);
      
      // If no cached data, fetch fresh data
      if (!weatherData) {
        weatherData = await fetchWeatherData({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        });
        
        if (!weatherData) {
          throw new Error("Failed to retrieve weather data for this location");
        }
        
        // Cache the result
        queryClient.setQueryData(weatherKey, weatherData);
      }

      // Always fetch fresh Bortle scale data when location changes
      const lightPollutionKey = ['lightPollution', latKey, lngKey];
      let bortleScale = 4; // Default value
      
      try {
        // Try to get cached Bortle data first
        let bortleData = queryClient.getQueryData(lightPollutionKey);
        
        if (!bortleData) {
          bortleData = await fetchLightPollutionData(newLocation.latitude, newLocation.longitude);
          if (bortleData?.bortleScale) {
            queryClient.setQueryData(lightPollutionKey, bortleData);
          }
        }
        
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

      // Fetch forecast in background
      const forecastKey = ['forecast', latKey, lngKey];
      let forecastData = queryClient.getQueryData(forecastKey);
      
      if (!forecastData) {
        try {
          forecastData = await fetchForecastData({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            days: 3
          });
          if (forecastData) {
            queryClient.setQueryData(forecastKey, forecastData);
          }
        } catch (forecastError) {
          console.error("Error fetching forecast during location update:", forecastError);
        }
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
  }, [locationData, setLocationData, navigate, queryClient]);

  return {
    loading,
    setLoading,
    handleLocationUpdate
  };
};
