
import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateSIQSWithWeatherData } from '@/hooks/siqs/siqsCalculationUtils';
import { fetchWeatherData, fetchForecastData } from '@/lib/api';
import { Language } from '@/services/geocoding/types';
import { toast } from 'sonner';

interface UseSIQSCalculatorLogicProps {
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
}

export const useSIQSCalculatorLogic = ({
  setCachedData,
  getCachedData
}: UseSIQSCalculatorLogicProps) => {
  const { t, language } = useLanguage();
  const [isCalculating, setIsCalculating] = useState(false);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const [siqsFactors, setSiqsFactors] = useState<any[]>([]);
  
  // Calculate SIQS for a given location
  const calculateSIQSForLocation = useCallback(async (
    latitude: number,
    longitude: number,
    locationName: string,
    saveToCache = true,
    bortleScale?: number | null,
    seeingConditions?: number,
    moonPhase?: number,
    setStatusMessage?: (message: string | null) => void,
    lang?: Language,
    cameraMeasurement?: number | null
  ) => {
    setIsCalculating(true);
    if (setStatusMessage) {
      setStatusMessage(t(
        "Fetching weather data for your location...",
        "正在获取您所在位置的天气数据..."
      ));
    }
    
    try {
      // Check cache first
      const cacheKey = `siqs_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
      const cachedResult = getCachedData(cacheKey);
      
      if (cachedResult && Date.now() - cachedResult.timestamp < 15 * 60 * 1000) {
        console.log("Using cached SIQS result:", cachedResult);
        setSiqsScore(cachedResult.score);
        setSiqsFactors(cachedResult.factors || []);
        
        if (setStatusMessage) {
          setStatusMessage(null);
        }
        
        return cachedResult.score;
      }
      
      // Fetch weather and forecast data in parallel
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetchWeatherData(latitude, longitude),
        fetchForecastData({ latitude, longitude, days: 3 })
      ]);
      
      if (!weatherResponse) {
        throw new Error("Failed to fetch weather data");
      }
      
      if (setStatusMessage) {
        setStatusMessage(t(
          "Calculating SIQS score...",
          "正在计算SIQS得分..."
        ));
      }
      
      // Calculate SIQS using our advanced algorithm
      const result = await calculateSIQSWithWeatherData(
        weatherResponse.weatherData,
        bortleScale !== undefined && bortleScale !== null ? bortleScale : 4,
        seeingConditions || 3,
        moonPhase || 0.5,
        forecastResponse,
        cameraMeasurement
      );
      
      // Save result
      setSiqsScore(result.score);
      setSiqsFactors(result.factors || []);
      
      // Cache the result
      if (saveToCache) {
        setCachedData(cacheKey, {
          ...result,
          timestamp: Date.now(),
          locationName
        });
      }
      
      if (setStatusMessage) {
        setStatusMessage(null);
      }
      
      return result.score;
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      
      if (setStatusMessage) {
        setStatusMessage(t(
          "Error calculating SIQS. Please try again.",
          "计算SIQS时出错。请重试。"
        ));
      }
      
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [t, getCachedData, setCachedData]);
  
  return {
    isCalculating,
    siqsScore,
    siqsFactors,
    calculateSIQSForLocation
  };
};
