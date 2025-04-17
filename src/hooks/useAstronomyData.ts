
/**
 * Hook for accessing astronomy data with efficient caching
 */

import { useState, useEffect, useMemo } from 'react';
import { getAstronomicalData, AstronomicalData } from '@/services/astronomy/astronomyCalculationService';

/**
 * Custom hook for accessing astronomy data with memoization
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Combined astronomy data with loading state
 */
export function useAstronomyData(latitude: number, longitude: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use memoization for astronomical data to prevent unnecessary recalculations
  const astronomyData = useMemo(() => {
    try {
      return getAstronomicalData(latitude, longitude);
    } catch (err) {
      console.error("Error calculating astronomy data:", err);
      return null;
    }
  }, [latitude, longitude]);
  
  useEffect(() => {
    // Set loading and error states appropriately
    setIsLoading(false);
    setError(astronomyData ? null : new Error("Failed to calculate astronomy data"));
  }, [astronomyData]);
  
  return {
    astronomyData,
    isLoading,
    error,
    // Format a method to format time consistently
    formatTime: (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
}

/**
 * Get multiple astronomical datasets in a batch for improved performance
 * @param locations Array of location coordinates
 * @returns Object mapping location keys to astronomy data
 */
export function useBatchAstronomyData(
  locations: Array<{ latitude: number, longitude: number, key: string }>
) {
  const [data, setData] = useState<Record<string, AstronomicalData | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const result: Record<string, AstronomicalData | null> = {};
        
        // Process locations in small batches to avoid blocking the main thread
        const batchSize = 5;
        for (let i = 0; i < locations.length; i += batchSize) {
          const batch = locations.slice(i, i + batchSize);
          
          // Calculate in parallel within each small batch
          await Promise.all(
            batch.map(async location => {
              try {
                const astroData = getAstronomicalData(location.latitude, location.longitude);
                result[location.key] = astroData;
              } catch (err) {
                console.error(`Error calculating astronomy data for ${location.key}:`, err);
                result[location.key] = null;
              }
            })
          );
          
          // Small delay between batches to prevent UI freezing
          if (i + batchSize < locations.length) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        setData(result);
      } catch (err) {
        console.error("Error in batch astronomy calculation:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (locations.length > 0) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [locations]);
  
  return { data, isLoading };
}
