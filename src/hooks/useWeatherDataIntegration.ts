
import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchWeatherData, fetchAirQualityData } from "@/lib/api";
import { getClimateRegion, getLocationClimateInfo } from '@/services/realTimeSiqs/climateRegions';

/**
 * Hook to integrate real-time weather data for a location
 */
export const useWeatherDataIntegration = (locationData: any, setLocationData: (data: any) => void) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Mutation for fetching weather data
  const { mutate: fetchWeather, isPending: isWeatherLoading } = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      return fetchWeatherData(coords);
    },
    onSuccess: (weatherData) => {
      if (weatherData && locationData) {
        console.log("Weather data fetched successfully:", weatherData);
        setLocationData({
          ...locationData,
          weatherData
        });
      }
    },
    onError: (error) => {
      console.error("Failed to fetch weather data:", error);
    }
  });

  // Mutation for fetching air quality data
  const { mutate: fetchAQI, isPending: isAQILoading } = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      return fetchAirQualityData(coords);
    },
    onSuccess: (aqiData) => {
      if (aqiData && locationData?.weatherData) {
        console.log("AQI data fetched successfully:", aqiData);
        
        // Update the weatherData with AQI information
        const updatedWeatherData = {
          ...locationData.weatherData,
          aqi: aqiData.aqi,
          aqiDescription: aqiData.description
        };
        
        setLocationData({
          ...locationData,
          weatherData: updatedWeatherData
        });
      }
    },
    onError: (error) => {
      console.error("Failed to fetch AQI data:", error);
    }
  });

  // Get climate region data for the location
  const updateClimateData = useCallback(() => {
    if (!locationData?.latitude || !locationData?.longitude) return;
    
    try {
      // Get climate region for this location
      const climateRegion = getClimateRegion(
        locationData.latitude, 
        locationData.longitude
      );
      
      // Get detailed climate info
      const climateInfo = getLocationClimateInfo(
        locationData.latitude,
        locationData.longitude
      );
      
      if (climateInfo) {
        console.log("Climate info:", climateInfo);
        setLocationData({
          ...locationData,
          climateData: {
            region: climateRegion?.name || 'Unknown',
            info: climateInfo
          }
        });
      }
    } catch (error) {
      console.error("Failed to update climate data:", error);
    }
  }, [locationData, setLocationData]);

  // Update all environmental data for the location
  const updateEnvironmentalData = useCallback(() => {
    if (!locationData?.latitude || !locationData?.longitude) return;
    
    setIsUpdating(true);
    
    // Fetch weather data
    fetchWeather({
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
    
    // Fetch AQI data
    fetchAQI({
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
    
    // Update climate data
    updateClimateData();
    
    setIsUpdating(false);
  }, [locationData, fetchWeather, fetchAQI, updateClimateData]);

  useEffect(() => {
    if (locationData && !locationData.weatherData) {
      // Initial data fetch when weather data is missing
      updateEnvironmentalData();
    }
  }, [locationData, updateEnvironmentalData]);

  return {
    updateWeatherData: updateEnvironmentalData,
    isLoading: isWeatherLoading || isAQILoading || isUpdating
  };
};
