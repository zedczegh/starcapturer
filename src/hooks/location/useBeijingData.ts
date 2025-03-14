
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchWeatherData, fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateMoonPhase } from "@/utils/siqsValidation";

export const usePrefetchBeijingData = () => {
  const [beijingData, setBeijingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  
  useEffect(() => {
    const prefetchData = async () => {
      try {
        const beijing = {
          name: language === 'en' ? "Beijing" : "北京",
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
        
        const moonPhase = calculateMoonPhase();
        
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
          name: beijing.name,
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
  }, [language]);
  
  return { beijingData, isLoading, setIsLoading };
};
