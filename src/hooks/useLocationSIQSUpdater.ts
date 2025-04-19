
import { useEffect, useRef, useCallback } from 'react';
import { calculateNighttimeSIQS, calculateTonightCloudCover } from '@/utils/nighttimeSIQS';
import { validateCloudCover } from '@/lib/siqs/utils';
import { calculateAstronomicalNight, formatTime } from '@/utils/astronomy/nightTimeCalculator';

/**
 * Hook to update SIQS score based on forecast data, ensuring consistency
 * throughout the application using astronomical night calculations
 * 
 * This enhanced version prioritizes astronomical night cloud cover over current conditions.
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
        
        // HIGH PRIORITY: Always try to calculate nighttime SIQS first
        // This now always takes priority over current weather
        const freshSIQSResult = calculateNighttimeSIQS(locationData, forecastData, t);
        
        if (freshSIQSResult) {
          console.log(`Updated SIQS score using astronomical night data: ${freshSIQSResult.score.toFixed(2)}`);
          
          // Update the SIQS result with the fresh calculation
          setLocationData({
            ...locationData,
            siqsResult: freshSIQSResult
          });
          
          updateAttemptedRef.current = true;
        } 
        // If nighttime SIQS calculator failed, try explicit nighttime cloud cover calculation
        else if (forecastData?.hourly?.cloud_cover) {
          // Calculate cloud cover for the astronomical night
          const tonightCloudCover = calculateTonightCloudCover(
            forecastData.hourly,
            latitude,
            longitude
          );
          
          if (tonightCloudCover !== null && tonightCloudCover !== undefined && !isNaN(tonightCloudCover)) {
            // Convert to SIQS score - giving more weight to nighttime cloud cover
            // Improved scoring algorithm for better accuracy
            const cloudScore = tonightCloudCover <= 10 ? 10 : Math.max(0, Math.min(10, 10 - (tonightCloudCover * 0.2)));
            
            console.log(`Using astronomical night cloud cover for SIQS (${nightTimeStr}): ${tonightCloudCover.toFixed(1)}% -> ${cloudScore.toFixed(1)}`);
            
            // Split evening and morning times if possible
            let eveningCloudCover = null;
            let morningCloudCover = null;
            
            if (forecastData.hourly.time && forecastData.hourly.cloud_cover) {
              // Calculate evening cloud cover (6pm-12am)
              const eveningTimes = forecastData.hourly.time.filter((time: string) => {
                const date = new Date(time);
                const hour = date.getHours();
                return hour >= 18 && hour <= 23;
              });
              
              if (eveningTimes.length > 0) {
                const eveningValues = eveningTimes.map((time: string) => {
                  const index = forecastData.hourly.time.indexOf(time);
                  return forecastData.hourly.cloud_cover[index];
                }).filter((val: any) => typeof val === 'number' && !isNaN(val));
                
                if (eveningValues.length > 0) {
                  eveningCloudCover = eveningValues.reduce((sum: number, val: number) => sum + val, 0) / eveningValues.length;
                }
              }
              
              // Calculate morning cloud cover (12am-6am)
              const morningTimes = forecastData.hourly.time.filter((time: string) => {
                const date = new Date(time);
                const hour = date.getHours();
                return hour >= 0 && hour < 6;
              });
              
              if (morningTimes.length > 0) {
                const morningValues = morningTimes.map((time: string) => {
                  const index = forecastData.hourly.time.indexOf(time);
                  return forecastData.hourly.cloud_cover[index];
                }).filter((val: any) => typeof val === 'number' && !isNaN(val));
                
                if (morningValues.length > 0) {
                  morningCloudCover = morningValues.reduce((sum: number, val: number) => sum + val, 0) / morningValues.length;
                }
              }
            }
            
            // Create factors array with nighttime cloud cover as primary factor
            const factors = [
              {
                name: t ? t("Astronomical Night Cloud Cover", "天文夜云层覆盖") : "Astronomical Night Cloud Cover",
                score: Math.max(0, Math.min(1, (10 - tonightCloudCover * 0.1) / 10)),  // Convert to 0-1 scale
                description: t 
                  ? t(`Tonight's cloud cover of ${tonightCloudCover.toFixed(1)}% during astronomical night`, 
                    `天文夜间云量${tonightCloudCover.toFixed(1)}%`) 
                  : `Tonight's cloud cover of ${tonightCloudCover.toFixed(1)}% during astronomical night`,
                weight: 0.7, // Give higher weight to nighttime cloud cover
                nighttimeData: {
                  average: tonightCloudCover,
                  timeRange: nightTimeStr,
                  evening: eveningCloudCover,
                  morning: morningCloudCover
                }
              }
            ];
            
            // Add other factors if available
            if (locationData.bortleScale) {
              factors.push({
                name: t ? t("Light Pollution", "光污染") : "Light Pollution",
                score: Math.max(0, Math.min(1, (10 - locationData.bortleScale) / 10)), // Convert to 0-1 scale
                description: t 
                  ? t(`Bortle Scale ${locationData.bortleScale}`, `布尔特尔等级${locationData.bortleScale}`) 
                  : `Bortle Scale ${locationData.bortleScale}`,
                weight: 0.3
              });
            }
            
            setLocationData({
              ...locationData,
              siqsResult: {
                score: cloudScore,
                isViable: tonightCloudCover < 40,
                factors: factors
              }
            });
            
            updateAttemptedRef.current = true;
          }
        } else if (locationData.weatherData?.cloudCover !== undefined) {
          // Last fallback to current weather if forecast is unavailable
          console.log("Using current weather as fallback (no forecast data available)");
          const currentCloudCover = validateCloudCover(locationData.weatherData.cloudCover);
          
          // Special handling for 0% cloud cover - should be score 10
          const cloudScore = currentCloudCover === 0 ? 10 : Math.max(0, Math.min(10, 10 - (currentCloudCover * 0.1)));
          
          console.log(`Using current cloud cover (${currentCloudCover}%) for SIQS: ${cloudScore.toFixed(2)}`);
          
          setLocationData({
            ...locationData,
            siqsResult: {
              score: cloudScore,
              isViable: cloudScore > 2,
              factors: [
                {
                  name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                  score: Math.max(0, Math.min(1, cloudScore / 10)), // Convert to 0-1 scale
                  description: t 
                    ? t(`Cloud cover of ${currentCloudCover}% affects imaging quality`, 
                      `${currentCloudCover}%的云量影响成像质量`) 
                    : `Cloud cover of ${currentCloudCover}% affects imaging quality`,
                  nighttimeData: {  // Add missing nighttimeData property
                    average: currentCloudCover,
                    timeRange: "current" 
                  }
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
