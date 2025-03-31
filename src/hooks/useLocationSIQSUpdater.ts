
import { useEffect, useRef, useCallback } from 'react';
import { calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';
import { toast } from 'sonner';

/**
 * Hook to update SIQS score based on forecast data, ensuring it matches with
 * the weather forecast astro scores for the current location
 */
export const useLocationSIQSUpdater = (
  locationData: any, 
  forecastData: any, 
  setLocationData: (data: any) => void,
  t: any
) => {
  const updateAttemptedRef = useRef(false);
  const forceUpdateRef = useRef(false);
  
  const resetUpdateState = useCallback(() => {
    updateAttemptedRef.current = false;
    forceUpdateRef.current = true;
  }, []);
  
  // Update SIQS score when forecast data becomes available
  useEffect(() => {
    // Reset update state when location changes
    if (locationData && locationData.id && !updateAttemptedRef.current) {
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
        // Calculate new SIQS based on nighttime conditions
        const freshSIQSResult = calculateNighttimeSIQS(locationData, forecastData, t);
        
        if (freshSIQSResult) {
          console.log(`Updated SIQS score: ${freshSIQSResult.score}`);
          
          // Update the SIQS result with the fresh calculation
          setLocationData({
            ...locationData,
            siqsResult: freshSIQSResult
          });
          
          updateAttemptedRef.current = true;
        } else if (locationData.weatherData?.cloudCover !== undefined) {
          // Fallback to current weather if nighttime forecast is unavailable
          console.log("Using fallback SIQS calculation based on current weather");
          const currentCloudCover = locationData.weatherData.cloudCover;
          
          // Simplified SIQS formula based on cloud cover
          // Better than showing no score at all
          const estimatedScore = currentCloudCover <= 75 
            ? Math.max(0, Math.min(10, 10 - (currentCloudCover * 0.1))) 
            : 0;
          
          console.log(`Using current cloud cover (${currentCloudCover}%) for SIQS: ${estimatedScore}`);
          
          setLocationData({
            ...locationData,
            siqsResult: {
              score: estimatedScore,
              isViable: estimatedScore > 2,
              factors: [
                {
                  name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                  score: Math.round((100 - currentCloudCover) * 10) / 10,
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
        console.error("Error updating SIQS with forecast data:", error);
        toast.error(t ? t("Error updating SIQS score", "更新SIQS评分时出错") : "Error updating SIQS score");
      }
    }
  }, [forecastData, locationData, setLocationData, t, resetUpdateState]);
  
  return { resetUpdateState };
};
