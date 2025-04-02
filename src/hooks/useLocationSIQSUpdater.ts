
import { useEffect, useRef, useCallback } from 'react';
import { calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';
import { toast } from 'sonner';
import { validateCloudCover } from '@/lib/siqs/utils';
import { rawBrightnessToMpsas, mpsasToBortle, getBortleBasedSIQS } from '@/utils/darkSkyMeterUtils';

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
        // First check if we have camera measurement data
        const hasCameraMeasurement = locationData.skyBrightness && 
                                    typeof locationData.skyBrightness.raw === 'number';
                                    
        if (hasCameraMeasurement) {
          // Prioritize camera measurement for most accurate SIQS
          const rawBrightness = locationData.skyBrightness.raw;
          const mpsas = rawBrightnessToMpsas(rawBrightness);
          const bortle = mpsasToBortle(mpsas);
          
          console.log(`Using camera-measured sky brightness: ${mpsas.toFixed(2)} MPSAS, Bortle ${bortle.toFixed(1)}`);
          
          // Calculate SIQS using camera-measured Bortle scale
          const cloudCover = validateCloudCover(locationData.weatherData?.cloudCover || 0);
          const siqs = getBortleBasedSIQS(bortle, cloudCover);
          
          console.log(`Camera-based SIQS: ${siqs.toFixed(1)}`);
          
          // Update the SIQS result with camera-based calculation
          setLocationData({
            ...locationData,
            bortleScale: bortle, // Update Bortle scale with measured value
            siqsResult: {
              score: siqs,
              isViable: siqs > 3,
              method: "camera-measurement",
              factors: [
                {
                  name: t ? t("Sky Brightness", "天空亮度") : "Sky Brightness",
                  score: 10 - (bortle - 1) * (10/8),
                  description: t 
                    ? t(`Measured sky brightness: ${mpsas.toFixed(2)} MPSAS (Bortle ${bortle.toFixed(1)})`, 
                      `测量的天空亮度：${mpsas.toFixed(2)} MPSAS（波特尔等级 ${bortle.toFixed(1)}）`) 
                    : `Measured sky brightness: ${mpsas.toFixed(2)} MPSAS (Bortle ${bortle.toFixed(1)})`
                },
                {
                  name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                  score: 10 - (cloudCover / 10),
                  description: t 
                    ? t(`Cloud cover: ${cloudCover}%`, 
                      `云层覆盖: ${cloudCover}%`) 
                    : `Cloud cover: ${cloudCover}%`
                }
              ]
            }
          });
          
          updateAttemptedRef.current = true;
          return;
        }
      
        // Calculate new SIQS based on nighttime conditions
        const freshSIQSResult = calculateNighttimeSIQS(locationData, forecastData, t);
        
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
        console.error("Error updating SIQS with forecast data:", error);
        toast.error(t ? t("Error updating SIQS score", "更新SIQS评分时出错") : "Error updating SIQS score");
      }
    }
  }, [forecastData, locationData, setLocationData, t, resetUpdateState]);
  
  return { resetUpdateState };
};
