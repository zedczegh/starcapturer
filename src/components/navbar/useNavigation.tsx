
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { fetchWeatherData, fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";

export const useNavigation = (locationId: string | null, beijingData: any, isLoading: boolean, setIsLoading: (value: boolean) => void) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const handleSIQSClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (locationId && locationId.startsWith('/location/')) {
      // If we're already on a location page, just stay there
      return;
    }
    
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If we already have Beijing data cached, use it immediately
      if (beijingData) {
        navigate(`/location/${beijingData.id}`, { 
          state: beijingData,
          replace: false 
        });
        return;
      }
      
      // Default to Beijing coordinates
      const beijing = {
        name: t("Beijing", "北京"),
        latitude: 39.9042,
        longitude: 116.4074
      };
      
      // Attempt to fetch weather data with error handling
      let weatherData;
      try {
        weatherData = await fetchWeatherData({
          latitude: beijing.latitude,
          longitude: beijing.longitude,
        });
      } catch (weatherError) {
        console.error("Failed to fetch weather data:", weatherError);
        // Use fallback values
        weatherData = {
          temperature: 20,
          humidity: 50,
          cloudCover: 30,
          windSpeed: 10,
          precipitation: 0,
          time: new Date().toISOString(),
          condition: "Clear",
          weatherCondition: "Clear",
          aqi: 50
        };
        toast({
          title: t("Using offline data", "使用离线数据"),
          description: t("Could not fetch real-time weather. Using offline data instead.", "无法获取实时天气数据，使用离线数据替代。"),
          variant: "default"
        });
      }
      
      // Default for Beijing (urban area)
      let bortleScale = 7; 
      
      try {
        const bortleData = await fetchLightPollutionData(beijing.latitude, beijing.longitude);
        if (bortleData?.bortleScale) {
          bortleScale = bortleData.bortleScale;
        }
      } catch (error) {
        console.error("Error fetching light pollution data:", error);
        // Continue with default bortle scale
      }
      
      // Calculate moon phase (simplified)
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
      
      const locationId = Date.now().toString();
      
      const locationData = {
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
      };
      
      navigate(`/location/${locationId}`, { 
        state: locationData,
        replace: false 
      });
    } catch (error) {
      console.error("Error navigating to Beijing:", error);
      
      toast({
        title: t("Error", "错误"),
        description: t("Failed to load SIQS data. Redirecting to home.", "加载SIQS数据失败，正在重定向到首页。"),
        variant: "destructive"
      });
      
      // Fallback - just navigate to home calculator section
      navigate('/#calculator-section');
      const calculatorSection = document.getElementById('calculator-section');
      if (calculatorSection) {
        calculatorSection.scrollIntoView({ behavior: 'smooth' });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return { handleSIQSClick };
};
