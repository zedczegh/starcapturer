
import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchWeatherData, fetchForecastData } from '@/lib/api';
import { Language } from '@/services/geocoding/types';
import { useSIQSCalculation } from './useSIQSCalculation';

interface UseSIQSCalculatorLogicProps {
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
}

/**
 * Hook to handle SIQS calculator logic with caching
 */
export const useSIQSCalculatorLogic = ({
  setCachedData,
  getCachedData
}: UseSIQSCalculatorLogicProps) => {
  const { t } = useLanguage();
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const [siqsFactors, setSiqsFactors] = useState<any[]>([]);
  
  // Use the SIQS calculation hook
  const { calculateSIQS, isCalculating } = useSIQSCalculation({
    fetchWeatherFn: fetchWeatherData,
    fetchForecastFn: fetchForecastData
  });
  
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
    
    // Calculate fresh SIQS
    const result = await calculateSIQS(
      latitude,
      longitude,
      bortleScale !== undefined && bortleScale !== null ? bortleScale : 4,
      seeingConditions || 3,
      moonPhase || 0.5,
      setStatusMessage,
      cameraMeasurement
    );
    
    // Save result
    if (result.score !== null) {
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
      
      return result.score;
    }
    
    return null;
  }, [t, getCachedData, setCachedData, calculateSIQS]);
  
  return {
    isCalculating,
    siqsScore,
    siqsFactors,
    calculateSIQSForLocation
  };
};
