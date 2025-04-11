import { useEffect, useRef, useCallback } from 'react';
import { calculateNighttimeSiqs } from '@/utils/nighttimeSIQS';
import { toast } from 'sonner';
import { validateCloudCover } from '@/lib/siqs/utils';
import { getConsistentSiqsValue } from '@/utils/nighttimeSIQS';

/**
 * Hook to update SIQS score based on forecast data, ensuring consistency
 * throughout the application
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
  const nighttimeCalculatedRef = useRef(false);
  
  // Reset update state for new calculations
  const resetUpdateState = useCallback(() => {
    updateAttemptedRef.current = false;
    forceUpdateRef.current = true;
    nighttimeCalculatedRef.current = false;
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
        // Always calculate SIQS based on nighttime conditions first
        const freshSIQSResult = calculateNighttimeSiqs(locationData, forecastData, t);
        
        if (freshSIQSResult) {
          console.log(`Updated SIQS score from nighttime data: ${freshSIQSResult.score.toFixed(2)}`);
          nighttimeCalculatedRef.current = true;
          
          // Update the SIQS result with the fresh calculation
          setLocationData({
            ...locationData,
            siqs: freshSIQSResult.score,
            siqsResult: freshSIQSResult
          });
          
          updateAttemptedRef.current = true;
        } else if (locationData.weatherData?.cloudCover !== undefined) {
          // Fallback to current weather if nighttime forecast is unavailable
          console.log("Using fallback SIQS calculation based on current weather");
          const currentCloudCover = validateCloudCover(locationData.weatherData.cloudCover);
          
          // Special handling for 0% cloud cover - should be score 10
          const cloudScore = currentCloudCover === 0 ? 100 : Math.max(0, 100 - (currentCloudCover * 2));
          const estimatedScore = cloudScore / 10;
          
          console.log(`Using current cloud cover (${currentCloudCover}%) for SIQS: ${estimatedScore.toFixed(2)}`);
          
          const fallbackResult = {
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
          };
          
          setLocationData({
            ...locationData,
            siqs: estimatedScore,
            siqsResult: fallbackResult
          });
          
          updateAttemptedRef.current = true;
        }
      } catch (error) {
        console.error("Error updating SIQS with forecast data:", error);
        toast.error(t ? t("Error updating SIQS score", "更新SIQS评分时出错") : "Error updating SIQS score");
      }
    }
    
    // Ensure consistent SIQS value if we already have data
    if (locationData && locationData.siqsResult) {
      const consistentSiqs = getConsistentSiqsValue(locationData);
      if (consistentSiqs !== locationData.siqs) {
        console.log(`Updating inconsistent SIQS value from ${locationData.siqs} to ${consistentSiqs}`);
        setLocationData({
          ...locationData,
          siqs: consistentSiqs
        });
      }
    }
  }, [forecastData, locationData, setLocationData, t, resetUpdateState]);
  
  return { 
    resetUpdateState,
    isNighttimeCalculated: nighttimeCalculatedRef.current
  };
};
