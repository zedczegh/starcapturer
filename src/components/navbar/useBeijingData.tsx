
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchWeatherData, fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";

export const usePrefetchBeijingData = () => {
  const [beijingData, setBeijingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  
  useEffect(() => {
    const prefetchData = async () => {
      try {
        const beijing = {
          latitude: 39.9042,
          longitude: 116.4074
        };
        
        const weatherData = await fetchWeatherData({
          latitude: beijing.latitude,
          longitude: beijing.longitude,
        });
        
        if (!weatherData) {
          console.error("Failed to fetch weather data for Beijing");
          return null;
        }
        
        let bortleScale = 7; 
        
        try {
          const bortleData = await fetchLightPollutionData(beijing.latitude, beijing.longitude);
          if (bortleData?.bortleScale) {
            bortleScale = bortleData.bortleScale;
          }
        } catch (error) {
          console.error("Error fetching light pollution data:", error);
          // Continue with default value
        }
        
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const c = 365.25 * year;
        const e = 30.6 * month;
        const jd = c + e + day - 694039.09;
        const moonPhase = (jd % 29.53) / 29.53;
        
        const siqsResult = calculateSIQS({
          cloudCover: weatherData.cloudCover,
          bortleScale: bortleScale,
          seeingConditions: 3, // Average
          windSpeed: weatherData.windSpeed,
          humidity: weatherData.humidity,
          moonPhase,
          aqi: weatherData.aqi,
          weatherCondition: weatherData.weatherCondition
        });
        
        const locationId = "beijing-" + Date.now().toString();
        
        setBeijingData({
          id: locationId,
          name: "Beijing",
          latitude: beijing.latitude,
          longitude: beijing.longitude,
          bortleScale: bortleScale,
          seeingConditions: 3,
          weatherData: weatherData,
          siqsResult,
          moonPhase,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error prefetching Beijing data:", error);
      }
    };
    
    prefetchData();
  }, []);
  
  return { beijingData, isLoading, setIsLoading };
};
