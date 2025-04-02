
import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateSIQSWithWeatherData } from '@/hooks/siqs/siqsCalculationUtils';

interface UseSIQSCalculationProps {
  fetchWeatherFn: (params: { latitude: number; longitude: number; days?: number }) => Promise<any>;
  fetchForecastFn: (params: { latitude: number; longitude: number; days: number }) => Promise<any>;
}

/**
 * A hook to handle SIQS calculation logic
 */
export const useSIQSCalculation = ({
  fetchWeatherFn,
  fetchForecastFn
}: UseSIQSCalculationProps) => {
  const { t } = useLanguage();
  const [isCalculating, setIsCalculating] = useState(false);
  
  /**
   * Calculate SIQS for specified location parameters
   */
  const calculateSIQS = useCallback(async (
    latitude: number,
    longitude: number,
    bortleScale: number = 4,
    seeingConditions: number = 3,
    moonPhase: number = 0.5,
    setStatusMessage?: (message: string | null) => void,
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
      // Fetch weather and forecast data in parallel
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetchWeatherFn({ latitude, longitude }),
        fetchForecastFn({ latitude, longitude, days: 3 })
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
        weatherResponse, // Changed from weatherResponse.weatherData
        bortleScale,
        seeingConditions,
        moonPhase,
        forecastResponse,
        cameraMeasurement
      );
      
      if (setStatusMessage) {
        setStatusMessage(null);
      }
      
      return result;
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      
      if (setStatusMessage) {
        setStatusMessage(t(
          "Error calculating SIQS. Please try again.",
          "计算SIQS时出错。请重试。"
        ));
      }
      
      return { score: null, factors: [] };
    } finally {
      setIsCalculating(false);
    }
  }, [t, fetchWeatherFn, fetchForecastFn]);
  
  return {
    calculateSIQS,
    isCalculating
  };
};
