import { useState, useCallback } from 'react';
import { fetchWeatherData, getLocationNameFromCoordinates } from '@/lib/api';
import { calculateNighttimeSiqs as calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';
import { fetchForecastData } from '@/lib/api/forecast';
import { Language } from '@/services/geocoding/types';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { prioritizeNighttimeCloudCover } from '@/utils/nighttimeSIQS';
import { processSiqsFactors } from './siqs/siqsCalculationUtils';
import { SIQSFactors } from '@/lib/siqs/types';

interface LocationDataCache {
  weatherData?: any;
  forecastData?: any;
  locationName?: string;
}

export const useSIQSCalculation = (
  setCachedData: (key: string, data: any) => void,
  getCachedData: (key: string) => any
) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  
  const calculateSIQSForLocation = useCallback(
    async (
      latitude: number,
      longitude: number,
      locationName: string,
      useCache: boolean = true,
      bortleScaleOverride?: number,
      seeingConditionsOverride?: number,
      clearSkyRateOverride?: number,
      setStatusMessage?: (message: string | null) => void,
      language?: Language
    ): Promise<number | null> => {
      setIsCalculating(true);
      setStatusMessage?.("Calculating SIQS...");
      
      let weatherData;
      let forecastData;
      
      const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      
      if (useCache) {
        const cachedData: LocationDataCache = getCachedData(cacheKey) || {};
        weatherData = cachedData.weatherData;
        forecastData = cachedData.forecastData;
      }
      
      try {
        if (!weatherData) {
          setStatusMessage?.("Fetching weather data...");
          weatherData = await fetchWeatherData(latitude, longitude, language);
          if (!weatherData) {
            throw new Error("Failed to fetch weather data");
          }
        }
        
        if (!forecastData) {
          setStatusMessage?.("Fetching forecast data...");
          forecastData = await fetchForecastData(latitude, longitude);
          if (!forecastData) {
            console.warn("Failed to fetch forecast data, using current conditions only");
          }
        }
        
        // Prioritize nighttime cloud cover
        const siqsFactors: SIQSFactors = prioritizeNighttimeCloudCover(weatherData);
        
        // Override values if provided
        if (bortleScaleOverride !== undefined) {
          siqsFactors.bortleScale = bortleScaleOverride;
        }
        if (seeingConditionsOverride !== undefined) {
          siqsFactors.seeingConditions = seeingConditionsOverride;
        }
        if (clearSkyRateOverride !== undefined) {
          siqsFactors.clearSkyRate = clearSkyRateOverride;
        }
        
        // Process SIQS factors
        const siqsResult = processSiqsFactors(siqsFactors);
        
        setSiqsScore(siqsResult.score);
        setStatusMessage?.(`SIQS: ${siqsResult.score.toFixed(1)}`);
        
        // Update cache
        setCachedData(cacheKey, {
          weatherData: weatherData,
          forecastData: forecastData,
          locationName: locationName
        });
        
        return siqsResult.score;
      } catch (error: any) {
        console.error("SIQS Calculation failed:", error.message);
        setStatusMessage?.(`SIQS Calculation failed: ${error.message}`);
        setSiqsScore(null);
        return null;
      } finally {
        setIsCalculating(false);
      }
    },
    [getCachedData, setCachedData]
  );
  
  return {
    isCalculating,
    siqsScore,
    calculateSIQSForLocation
  };
};
