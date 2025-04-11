
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { validateInputs, calculateMoonPhase } from "@/utils/siqsValidation";
import { getWeatherData } from "@/services/environmentalDataService";
import { getBortleScale } from "@/services/environmentalDataService";
import { v4 as uuidv4 } from "uuid";
import { calculateNighttimeSIQS } from "@/utils/nighttimeSIQS";
import { fetchForecastData } from "@/lib/api";

// Extract forecast fetching logic
import { fetchForecastForLocation } from "./siqs/forecastFetcher";

// Extract scoring and normalization logic
import { 
  normalizeScore, 
  calculateSIQSWithWeatherData 
} from "./siqs/siqsCalculationUtils";

export const useSIQSCalculation = (
  setCachedData: (key: string, data: any) => void,
  getCachedData: (key: string, maxAge?: number) => any
) => {
  const navigate = useNavigate();
  const [isCalculating, setIsCalculating] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  
  // Pre-compute moon phase for better performance - refreshed on component mount
  const currentMoonPhase = useMemo(() => calculateMoonPhase(), []);
  
  const calculateSIQSForLocation = useCallback(async (
    lat: number, 
    lng: number, 
    name: string, 
    displayOnly: boolean = false, 
    bortleScale: number, 
    seeingConditions: number, 
    setLoading?: (loading: boolean) => void, 
    setStatusMessage?: (message: string | null) => void,
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
        language,
        setStatusMessage
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
      
      // Fetch forecast data to get night conditions
      const forecastResult = await fetchForecastForLocation(lat, lng);
      if (forecastResult) {
        setForecastData(forecastResult);
      }
      
      // Get Bortle scale data
      const actualBortleScale = await getBortleScale(
        lat,
        lng
      );
      
      // Validate Bortle scale before proceeding
      const validBortleScale = (actualBortleScale < 1 || actualBortleScale > 9 || isNaN(actualBortleScale))
        ? 5 // Default to moderate value if invalid
        : actualBortleScale;
      
      // We need to recalculate moon phase to ensure it's fresh
      const freshMoonPhase = calculateMoonPhase();
      
      // Calculate SIQS score using utility function
      const siqsResult = await calculateSIQSWithWeatherData(
        data,
        validBortleScale,
        seeingConditions,
        freshMoonPhase,
        forecastResult
      );
      
      // Ensure SIQS score is consistently on a 0-10 scale
      const normalizedScore = normalizeScore(siqsResult.score);
      
      if (displayOnly) {
        // For consistency, always store the 0-10 scale value
        setSiqsScore(normalizedScore);
        setIsCalculating(false);
        return;
      }
      
      // Generate a stable, unique ID using UUID
      const locationId = uuidv4();
      
      const locationData = {
        id: locationId,
        name: name,
        latitude: lat,
        longitude: lng,
        bortleScale: validBortleScale,
        seeingConditions,
        weatherData: data,
        siqsResult: {
          ...siqsResult,
          score: normalizedScore // Ensure the score is on a 0-10 scale
        },
        moonPhase: freshMoonPhase,
        timestamp: new Date().toISOString(),
      };
      
      console.log("Navigating to location details with data:", locationData);
      
      // Ensure navigation happens immediately to prevent data loss
      navigate(`/location/${locationId}`, { 
        state: locationData,
        replace: false
      });
      
      // Also save to localStorage as a backup with UUID as key
      try {
        localStorage.setItem(`location_${locationId}`, JSON.stringify(locationData));
        localStorage.setItem('latest_siqs_location', JSON.stringify({
          name,
          latitude: lat,
          longitude: lng,
          bortleScale: validBortleScale
        }));
      } catch (e) {
        console.error("Failed to save to localStorage", e);
      }
      
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
  }, [isCalculating, navigate, getCachedData, setCachedData]);
  
  return {
    isCalculating,
    weatherData,
    siqsScore,
    forecastData,
    currentMoonPhase,
    setSiqsScore,
    validateInputs,
    calculateSIQSForLocation
  };
};
