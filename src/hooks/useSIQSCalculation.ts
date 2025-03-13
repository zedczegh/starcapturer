
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWeatherData, fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useLocationDataCache } from "./useLocationData";
import { useToast } from "@/hooks/use-toast";

export const useSIQSCalculation = (
  setCachedData: (key: string, data: any) => void,
  getCachedData: (key: string, maxAge?: number) => any
) => {
  const navigate = useNavigate();
  const [isCalculating, setIsCalculating] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Pre-compute values for better performance
  const currentMoonPhase = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const c = 365.25 * year;
    const e = 30.6 * month;
    const jd = c + e + day - 694039.09;
    return (jd % 29.53) / 29.53;
  }, []);
  
  const validateInputs = (locationName: string, latitude: string, longitude: string, language: string): boolean => {
    if (!locationName.trim()) {
      return false;
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return false;
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return false;
    }
    
    return true;
  };
  
  const calculateSIQSForLocation = async (
    lat: number, 
    lng: number, 
    name: string, 
    displayOnly: boolean = false, 
    bortleScale: number, 
    seeingConditions: number, 
    setLoading?: (loading: boolean) => void, 
    setStatusMessage?: (message: string) => void,
    language: string = 'en'
  ) => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    displayOnly ? null : setLoading && setLoading(true);
    
    // Check if we have cached weather data
    const cacheKey = `weather-${lat.toFixed(4)}-${lng.toFixed(4)}`;
    const cachedWeatherData = !displayOnly ? null : getCachedData(cacheKey, 2 * 60 * 1000); // 2 minute cache for weather
    
    try {
      let data;
      
      if (cachedWeatherData) {
        data = cachedWeatherData;
      } else {
        try {
          data = await fetchWeatherData({
            latitude: lat,
            longitude: lng,
          });
          
          if (data) {
            // Cache the weather data for future use
            setCachedData(cacheKey, data);
          }
        } catch (weatherError) {
          console.error("Failed to fetch weather data:", weatherError);
          
          // Use fallback weather data
          data = {
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
          
          // Show toast notification if not in display-only mode
          if (!displayOnly) {
            toast({
              title: language === 'en' ? "Using offline data" : "使用离线数据",
              description: language === 'en'
                ? "Could not fetch real-time weather. Using offline data instead."
                : "无法获取实时天气数据，使用离线数据替代。"
            });
          }
        }
      }
      
      if (!data) {
        setStatusMessage && setStatusMessage(language === 'en' ? 
          "Could not retrieve weather data. Please try again." : 
          "无法获取天气数据，请重试。");
        setIsCalculating(false);
        displayOnly ? null : setLoading && setLoading(false);
        return;
      }
      
      setWeatherData(data);
      
      let actualBortleScale = bortleScale;
      if (!displayOnly || actualBortleScale === 4) {
        // Check if we have cached Bortle scale data
        const bortleCacheKey = `bortle-${lat.toFixed(4)}-${lng.toFixed(4)}`;
        const cachedBortleData = getCachedData(bortleCacheKey, 60 * 60 * 1000); // 1 hour cache
        
        if (cachedBortleData) {
          actualBortleScale = cachedBortleData.bortleScale;
        } else {
          try {
            const lightPollutionData = await fetchLightPollutionData(lat, lng);
            if (lightPollutionData && lightPollutionData.bortleScale) {
              actualBortleScale = lightPollutionData.bortleScale;
              
              // Cache the Bortle scale data
              setCachedData(bortleCacheKey, lightPollutionData);
            }
          } catch (lightError) {
            console.error("Error fetching light pollution data in SIQS calculation:", lightError);
            // Continue with current Bortle scale value based on location or user setting
          }
        }
      }
      
      const siqsResult = calculateSIQS({
        cloudCover: data.cloudCover,
        bortleScale: actualBortleScale,
        seeingConditions,
        windSpeed: data.windSpeed,
        humidity: data.humidity,
        moonPhase: currentMoonPhase,
        precipitation: data.precipitation,
        weatherCondition: data.weatherCondition,
        aqi: data.aqi
      });
      
      if (displayOnly) {
        setSiqsScore(siqsResult.score * 10);
        setIsCalculating(false);
        return;
      }
      
      const locationId = Date.now().toString();
      
      const locationData = {
        id: locationId,
        name: name,
        latitude: lat,
        longitude: lng,
        bortleScale: actualBortleScale,
        seeingConditions,
        weatherData: data,
        siqsResult,
        moonPhase: currentMoonPhase,
        timestamp: new Date().toISOString(),
      };
      
      console.log("Navigating to location details with data:", locationData);
      
      // Prefetch and prepare the next page for faster transition
      setTimeout(() => {
        navigate(`/location/${locationId}`, { 
          state: locationData,
          replace: false
        });
      }, 10);
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      setStatusMessage && setStatusMessage(language === 'en' ? 
        "An error occurred while calculating SIQS. Please try again." : 
        "计算SIQS时发生错误，请重试。");
      setIsCalculating(false);
      displayOnly ? null : setLoading && setLoading(false);
    }
  };
  
  return {
    isCalculating,
    weatherData,
    siqsScore,
    currentMoonPhase,
    setSiqsScore,
    validateInputs,
    calculateSIQSForLocation
  };
};
