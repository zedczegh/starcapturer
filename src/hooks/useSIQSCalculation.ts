
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useToast } from "@/hooks/use-toast";
import { validateInputs, calculateMoonPhase } from "@/utils/siqsValidation";
import { getWeatherData, getBortleScaleData } from "@/services/environmentalDataService";

export const useSIQSCalculation = (
  setCachedData: (key: string, data: any) => void,
  getCachedData: (key: string, maxAge?: number) => any
) => {
  const navigate = useNavigate();
  const [isCalculating, setIsCalculating] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Pre-compute moon phase for better performance
  const currentMoonPhase = useMemo(() => calculateMoonPhase(), []);
  
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
    
    try {
      // Get weather data
      const cacheKey = `weather-${lat.toFixed(4)}-${lng.toFixed(4)}`;
      const data = await getWeatherData(
        lat, 
        lng, 
        cacheKey, 
        getCachedData, 
        setCachedData, 
        displayOnly,
        language
      );
      
      if (!data) {
        setStatusMessage && setStatusMessage(language === 'en' ? 
          "Could not retrieve weather data. Please try again." : 
          "无法获取天气数据，请重试。");
        setIsCalculating(false);
        displayOnly ? null : setLoading && setLoading(false);
        return;
      }
      
      setWeatherData(data);
      
      // Get Bortle scale data
      const actualBortleScale = await getBortleScaleData(
        lat,
        lng,
        name,
        bortleScale,
        displayOnly,
        getCachedData,
        setCachedData,
        language
      );
      
      // Validate Bortle scale before proceeding
      const validBortleScale = (actualBortleScale < 1 || actualBortleScale > 9 || isNaN(actualBortleScale))
        ? 5 // Default to moderate value if invalid
        : actualBortleScale;
      
      // Calculate SIQS
      const siqsResult = calculateSIQS({
        cloudCover: data.cloudCover,
        bortleScale: validBortleScale,
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
      
      const locationId = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString()}`;
      
      const locationData = {
        id: locationId,
        name: name,
        latitude: lat,
        longitude: lng,
        bortleScale: validBortleScale,
        seeingConditions,
        weatherData: data,
        siqsResult,
        moonPhase: currentMoonPhase,
        timestamp: new Date().toISOString(),
      };
      
      console.log("Navigating to location details with data:", locationData);
      
      // Ensure navigation happens immediately to prevent data loss
      navigate(`/location/${locationId}`, { 
        state: locationData,
        replace: false
      });
      
      // Wait a small delay to ensure the state is updated
      setTimeout(() => {
        setIsCalculating(false);
        displayOnly ? null : setLoading && setLoading(false);
      }, 300);
      
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
