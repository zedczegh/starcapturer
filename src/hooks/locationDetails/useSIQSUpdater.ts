
import { useCallback, useRef } from 'react';
import { calculateSIQS } from '@/lib/calculateSIQS';

export function useSIQSUpdater() {
  const updateCompleteRef = useRef(false);

  // Reset update state to force a fresh update
  const resetUpdateState = useCallback(() => {
    updateCompleteRef.current = false;
  }, []);

  /**
   * Updates SIQS score using forecast data to ensure consistency
   */
  const updateSIQSWithForecast = useCallback((
    locationData: any,
    forecastData: any,
    forecastLoading: boolean,
    setLocationData: (data: any) => void
  ) => {
    // Skip if already updated or no forecast data available
    if (updateCompleteRef.current || forecastLoading || !forecastData || !locationData) {
      return false;
    }

    // Check if we need to update SIQS (missing or zero score)
    const needsUpdate = 
      !locationData.siqsResult ||
      typeof locationData.siqsResult.score !== "number" ||
      locationData.siqsResult.score === 0;

    if (needsUpdate) {
      console.log("Updating SIQS score with forecast data");
      
      // Ensure we have all required data
      if (!locationData.weatherData || 
          !locationData.bortleScale || 
          typeof locationData.weatherData.cloudCover !== 'number') {
        console.log("Missing required data for SIQS calculation");
        return false;
      }

      try {
        // Calculate SIQS score
        const siqsResult = calculateSIQS({
          cloudCover: locationData.weatherData.cloudCover,
          bortleScale: locationData.bortleScale || 4,
          seeingConditions: locationData.seeingConditions || 3,
          windSpeed: locationData.weatherData.windSpeed || 0,
          humidity: locationData.weatherData.humidity || 50,
          moonPhase: locationData.moonPhase || 0,
          aqi: locationData.weatherData.aqi || 50,
          weatherCondition: locationData.weatherData.weatherCondition || 'Clear',
          precipitation: locationData.weatherData.precipitation || 0
        });

        // Update location data with SIQS result
        setLocationData({
          ...locationData,
          siqsResult,
          lastSiqsUpdate: new Date().toISOString()
        });

        // Mark as updated
        updateCompleteRef.current = true;
        return true;
      } catch (error) {
        console.error("Error calculating SIQS:", error);
        return false;
      }
    }

    return false;
  }, []);

  return { 
    updateSIQSWithForecast,
    resetUpdateState
  };
}
