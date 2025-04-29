
import { useState, useEffect } from 'react';
import { forecastAstroService, ForecastDayAstroData } from '@/services/forecast/forecastAstroService';

/**
 * Hook for accessing forecast astronomical data for a specific location
 */
export function useForecastAstroData(
  latitude?: number,
  longitude?: number,
  bortleScale?: number
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [forecastData, setForecastData] = useState<ForecastDayAstroData[]>([]);
  const [bestDays, setBestDays] = useState<ForecastDayAstroData[]>([]);
  
  // Fetch forecast data when location changes
  useEffect(() => {
    if (!latitude || !longitude) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get full forecast data
        const data = await forecastAstroService.getFullForecastAstroData(
          latitude,
          longitude,
          bortleScale
        );
        setForecastData(data);
        
        // Get best days (quality >= 6.5)
        const best = await forecastAstroService.getBestAstroDays(
          latitude,
          longitude,
          bortleScale,
          6.5
        );
        setBestDays(best);
      } catch (err) {
        console.error("Error in useForecastAstroData:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [latitude, longitude, bortleScale]);
  
  return {
    loading,
    error,
    forecastData,
    bestDays,
    
    // Provide a method to get a specific day's data
    getSpecificDay: (dayIndex: number) => {
      return forecastData[dayIndex] || null;
    },
    
    // Get upcoming good observation nights
    getUpcomingGoodNights: (minQuality = 6.0, maxCount = 3) => {
      return forecastData
        .filter(day => day.siqs !== null && day.siqs >= minQuality)
        .sort((a, b) => a.dayIndex - b.dayIndex)
        .slice(0, maxCount);
    },
    
    // Refresh data manually if needed
    refreshData: async () => {
      if (!latitude || !longitude) return;
      
      setLoading(true);
      try {
        const data = await forecastAstroService.getFullForecastAstroData(
          latitude,
          longitude,
          bortleScale
        );
        setForecastData(data);
        
        const best = await forecastAstroService.getBestAstroDays(
          latitude,
          longitude,
          bortleScale,
          6.5
        );
        setBestDays(best);
      } catch (err) {
        console.error("Error refreshing forecast astro data:", err);
      } finally {
        setLoading(false);
      }
    }
  };
}
