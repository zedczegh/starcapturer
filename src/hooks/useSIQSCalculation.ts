
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { validateInputs, calculateMoonPhase } from "@/utils/siqsValidation";
import { getWeatherData, getBortleScaleData } from "@/services/environmentalDataService";
import { v4 as uuidv4 } from "uuid";
import { calculateNighttimeSIQS } from "@/utils/nighttimeSIQS";
import { fetchForecastData } from "@/lib/api";
import { 
  rawBrightnessToMpsas, 
  mpsasToBortle,
  getBortleBasedSIQS
} from "@/utils/darkSkyMeterUtils";

// Extract forecast fetching logic
import { fetchForecastForLocation } from "./siqs/forecastFetcher";

// Extract scoring and normalization logic
import { 
  normalizeScore, 
  calculateSIQSWithWeatherData,
  bortleToSIQSComponent 
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
    language: string = 'en',
    cameraMeasurement: number | null = null
  ) => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    displayOnly ? null : setLoading && setLoading(true);
    
    try {
      // If we have camera measurement, convert it to MPSAS and Bortle scale
      let measuredBortleScale = null;
      let measuredMPSAS = null;
      
      if (cameraMeasurement !== null) {
        measuredMPSAS = rawBrightnessToMpsas(cameraMeasurement);
        measuredBortleScale = mpsasToBortle(measuredMPSAS);
        
        console.log(`Using camera measurement: ${measuredMPSAS.toFixed(2)} MPSAS, Bortle ${measuredBortleScale.toFixed(1)}`);
        
        // Prioritize measured Bortle scale over database/estimated values
        bortleScale = measuredBortleScale;
      }
      
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
      
      // If we have camera measurement, add it to weather data
      if (measuredMPSAS !== null && measuredBortleScale !== null) {
        data.skyBrightness = {
          mpsas: measuredMPSAS,
          bortleScale: measuredBortleScale,
          raw: cameraMeasurement
        };
      }
      
      setWeatherData(data);
      
      // Fetch forecast data to get night conditions
      const forecastResult = await fetchForecastForLocation(lat, lng);
      if (forecastResult) {
        setForecastData(forecastResult);
      }
      
      // If we don't have a camera measurement, get Bortle scale from database/API
      if (measuredBortleScale === null) {
        const actualBortleScale = await getBortleScaleData(
          lat,
          lng,
          name,
          bortleScale,
          displayOnly,
          getCachedData,
          setCachedData,
          language,
          setStatusMessage
        );
        
        // Validate Bortle scale before proceeding
        const validBortleScale = (actualBortleScale < 1 || actualBortleScale > 9 || isNaN(actualBortleScale))
          ? 5 // Default to moderate value if invalid
          : actualBortleScale;
          
        bortleScale = validBortleScale;
      }
      
      // We need to recalculate moon phase to ensure it's fresh
      const freshMoonPhase = calculateMoonPhase();
      
      // Calculate SIQS score using utility function
      const siqsResult = await calculateSIQSWithWeatherData(
        data,
        bortleScale,
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
        bortleScale: bortleScale,
        seeingConditions,
        weatherData: data,
        siqsResult: {
          ...siqsResult,
          score: normalizedScore // Ensure the score is on a 0-10 scale
        },
        moonPhase: freshMoonPhase,
        timestamp: new Date().toISOString(),
      };
      
      // If we have camera measurement data, include it
      if (measuredMPSAS !== null && measuredBortleScale !== null) {
        locationData.skyBrightness = {
          mpsas: measuredMPSAS,
          bortleScale: measuredBortleScale,
          raw: cameraMeasurement,
          timestamp: new Date().toISOString()
        };
      }
      
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
          bortleScale: bortleScale,
          // Add camera measurement data if available
          ...(cameraMeasurement !== null ? {
            skyBrightness: {
              raw: cameraMeasurement,
              mpsas: measuredMPSAS,
              bortleScale: measuredBortleScale
            }
          } : {})
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
