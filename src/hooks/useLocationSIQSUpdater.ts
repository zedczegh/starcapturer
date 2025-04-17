
import { useEffect, useRef, useCallback } from 'react';
import { calculateNighttimeSIQS, calculateTonightCloudCover } from '@/utils/nighttimeSIQS';
import { toast } from 'sonner';
import { validateCloudCover } from '@/lib/siqs/utils';
import { calculateAstronomicalNight, formatTime } from '@/utils/astronomy/nightTimeCalculator';

/**
 * Hook to update SIQS score based on forecast data, ensuring consistency
 * throughout the application using astronomical night calculations
 */
export const useLocationSIQSUpdater = (
  locationData: any, 
  forecastData: any, 
  setLocationData: (data: any) => void,
  t: any
) => {
  const updateAttemptedRef = useRef(false);
  const forceUpdateRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const lastForecastTimestampRef = useRef<string | null>(null);
  
  // Reset update state for new calculations
  const resetUpdateState = useCallback(() => {
    updateAttemptedRef.current = false;
    forceUpdateRef.current = true;
    console.log("SIQS update state reset");
  }, []);
  
  // Update SIQS score when forecast data becomes available or changes
  useEffect(() => {
    // Track location changes to force recalculation
    const locationSignature = locationData ? 
      `${locationData.latitude?.toFixed(6)}-${locationData.longitude?.toFixed(6)}` : null;
    
    // Get forecast signature to detect actual data changes
    const forecastSignature = forecastData?.hourly?.time?.[0] || null;
    
    // Reset state when location changes
    if (locationSignature !== lastLocationRef.current) {
      console.log("Location changed, resetting SIQS update state");
      lastLocationRef.current = locationSignature;
      lastForecastTimestampRef.current = null; // Reset forecast timestamp
      resetUpdateState();
    }
    
    // Check if forecast data has actually changed
    const forecastChanged = forecastSignature !== lastForecastTimestampRef.current;
    if (forecastChanged && forecastSignature) {
      console.log("Forecast data changed, updating SIQS");
      lastForecastTimestampRef.current = forecastSignature;
      resetUpdateState();
    }
    
    // Only update SIQS when forecast data is available or on forced update
    const shouldUpdate = (
      forecastData?.hourly && 
      Array.isArray(forecastData.hourly.time) &&
      forecastData.hourly.time.length > 0 &&
      locationData &&
      (!updateAttemptedRef.current || forceUpdateRef.current)
    );
    
    if (shouldUpdate) {
      console.log("Updating SIQS based on hourly forecast data");
      forceUpdateRef.current = false;
      
      try {
        // Extract coordinates for astronomical night calculations
        const latitude = locationData.latitude || 0;
        const longitude = locationData.longitude || 0;
        
        // Get astronomical night times
        const { start, end } = calculateAstronomicalNight(latitude, longitude);
        const nightTimeStr = `${formatTime(start)}-${formatTime(end)}`;
        
        console.log(`Astronomical night for location: ${nightTimeStr}`);
        
        // Calculate new SIQS based on astronomical nighttime conditions
        const freshSIQSResult = calculateNighttimeSIQS(locationData, forecastData, t);
        
        if (freshSIQSResult) {
          console.log(`Updated SIQS score: ${freshSIQSResult.score.toFixed(2)}`);
          
          // Update the SIQS result with the fresh calculation
          setLocationData({
            ...locationData,
            siqsResult: freshSIQSResult
          });
          
          updateAttemptedRef.current = true;
        } else if (forecastData?.hourly?.cloud_cover) {
          // Fallback to tonight's cloud cover if full SIQS calculation failed
          console.log("Using fallback astronomical night cloud cover calculation");
          
          const tonightCloudCover = calculateTonightCloudCover(
            forecastData.hourly,
            latitude,
            longitude
          );
          
          // Score calculation adjusts for cloud cover impact
          const cloudScore = tonightCloudCover === 0 ? 100 : Math.max(0, 100 - (tonightCloudCover * 2));
          const estimatedScore = cloudScore / 10;
          
          console.log(`Using tonight's astronomical night cloud cover (${tonightCloudCover}%) for SIQS: ${estimatedScore.toFixed(2)}`);
          
          setLocationData({
            ...locationData,
            siqsResult: {
              score: estimatedScore,
              isViable: estimatedScore > 2,
              factors: [
                {
                  name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                  score: estimatedScore, // Already on 0-10 scale
                  description: t 
                    ? t(`Tonight's cloud cover of ${tonightCloudCover.toFixed(1)}% affects imaging quality`, 
                      `今晚云量${tonightCloudCover.toFixed(1)}%影响成像质量`) 
                    : `Tonight's cloud cover of ${tonightCloudCover.toFixed(1)}% affects imaging quality`,
                  nighttimeData: {
                    average: tonightCloudCover,
                    timeRange: nightTimeStr
                  }
                }
              ]
            }
          });
          
          updateAttemptedRef.current = true;
        } else if (locationData.weatherData?.cloudCover !== undefined) {
          // Last fallback to current weather if forecast is unavailable
          console.log("Using current weather as fallback (no forecast data available)");
          const currentCloudCover = validateCloudCover(locationData.weatherData.cloudCover);
          
          // Special handling for 0% cloud cover - should be score 10
          const cloudScore = currentCloudCover === 0 ? 100 : Math.max(0, 100 - (currentCloudCover * 2));
          const estimatedScore = cloudScore / 10;
          
          console.log(`Using current cloud cover (${currentCloudCover}%) for SIQS: ${estimatedScore.toFixed(2)}`);
          
          setLocationData({
            ...locationData,
            siqsResult: {
              score: estimatedScore,
              isViable: estimatedScore > 2,
              factors: [
                {
                  name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                  score: estimatedScore, // Already on 0-10 scale
                  description: t 
                    ? t(`Cloud cover of ${currentCloudCover}% affects imaging quality`, 
                      `${currentCloudCover}%的云量影响成像质量`) 
                    : `Cloud cover of ${currentCloudCover}% affects imaging quality`
                }
              ]
            }
          });
          
          updateAttemptedRef.current = true;
        }
      } catch (error) {
        console.error("Error updating SIQS:", error);
      }
    }
  }, [locationData, forecastData, t, setLocationData, resetUpdateState]);
  
  return {
    resetUpdateState,
  };
};
