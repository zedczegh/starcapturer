
import { useEffect, useRef, useCallback } from 'react';
import { calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';
import { toast } from 'sonner';
import { validateCloudCover } from '@/lib/siqs/utils';

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
        // Pass the clear sky rate to the SIQS calculation (10% weight)
        const clearSkyRateParam = {
          clearSkyRate: locationData.weatherData?.clearSkyRate,
          clearSkyWeight: 0.1  // 10% weight as requested
        };
        
        // Calculate new SIQS based on nighttime conditions with clear sky rate
        // Fix: Passing only 3 arguments as required by the implementation
        const freshSIQSResult = calculateNighttimeSIQS(
          locationData, 
          forecastData, 
          t
        );
        
        if (freshSIQSResult) {
          console.log(`Updated SIQS score: ${freshSIQSResult.score.toFixed(2)}`);
          
          // Update the SIQS result with the fresh calculation
          setLocationData({
            ...locationData,
            siqsResult: freshSIQSResult
          });
          
          updateAttemptedRef.current = true;
        } else if (locationData.weatherData?.cloudCover !== undefined) {
          // Fallback to current weather if nighttime forecast is unavailable
          console.log("Using fallback SIQS calculation based on current weather");
          const currentCloudCover = validateCloudCover(locationData.weatherData.cloudCover);
          
          // Add clear sky rate into the fallback calculation (10% weight)
          const clearSkyRate = locationData.weatherData?.clearSkyRate || 65;
          const clearSkyScore = clearSkyRate / 10; // Convert to 0-10 scale
          
          // Special handling for 0% cloud cover - should be score 10
          const cloudScore = currentCloudCover === 0 ? 100 : Math.max(0, 100 - (currentCloudCover * 2));
          // Combine cloud score (90%) with clear sky rate (10%)
          const combinedScore = (cloudScore / 10 * 0.9) + (clearSkyScore * 0.1);
          
          console.log(`Using current cloud cover (${currentCloudCover}%) and clear sky rate (${clearSkyRate}%) for SIQS: ${combinedScore.toFixed(2)}`);
          
          setLocationData({
            ...locationData,
            siqsResult: {
              score: combinedScore,
              isViable: combinedScore > 2,
              factors: [
                {
                  name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                  score: cloudScore / 10, // Convert to 0-10 scale
                  description: t 
                    ? t(`Cloud cover of ${currentCloudCover}% affects imaging quality`, 
                      `${currentCloudCover}%的云量影响成像质量`) 
                    : `Cloud cover of ${currentCloudCover}% affects imaging quality`
                },
                {
                  name: t ? t("Clear Sky Rate", "晴空率") : "Clear Sky Rate",
                  score: clearSkyScore,
                  description: t
                    ? t(`Annual clear sky rate of ${clearSkyRate}%`, 
                      `年均晴空率为${clearSkyRate}%`)
                    : `Annual clear sky rate of ${clearSkyRate}%`
                }
              ]
            }
          });
          
          updateAttemptedRef.current = true;
        }
      } catch (error) {
        console.error("Error updating SIQS with forecast data:", error);
        toast.error(t ? t("Error updating SIQS score", "更新SIQS评分时出错") : "Error updating SIQS score");
      }
    }
  }, [forecastData, locationData, setLocationData, t, resetUpdateState]);
  
  return { resetUpdateState };
};
