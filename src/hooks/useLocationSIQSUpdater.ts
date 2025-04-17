
import { useEffect, useRef, useCallback } from 'react';
import { calculateNighttimeSIQS, calculateTonightCloudCover, getCachedAstronomicalNight } from '@/utils/nighttimeSIQS';
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
        
        // First check for cached astronomical night data
        let nightTimeStr: string;
        const cachedNight = getCachedAstronomicalNight(latitude, longitude);
        
        if (cachedNight) {
          nightTimeStr = cachedNight.formatted;
          console.log(`Using cached astronomical night: ${nightTimeStr}`);
        } else {
          // Get astronomical night times
          const { start, end } = calculateAstronomicalNight(latitude, longitude);
          nightTimeStr = `${formatTime(start)}-${formatTime(end)}`;
          console.log(`Calculated astronomical night for location: ${nightTimeStr}`);
        }
        
        // First try calculating with our enhanced nighttime SIQS algorithm
        const freshSIQSResult = calculateNighttimeSIQS(locationData, forecastData, t);
        
        if (freshSIQSResult) {
          console.log(`Updated SIQS score: ${freshSIQSResult.score.toFixed(2)}`);
          
          // Make a copy to avoid modifying the original
          const updatedLocationData = { ...locationData };
          
          // Ensure we have metadata object for astronomical night data
          if (!updatedLocationData.metadata) {
            updatedLocationData.metadata = {};
          }
          
          // Add astronomical night data if it doesn't exist
          if (!updatedLocationData.metadata.astronomicalNight) {
            if (cachedNight) {
              updatedLocationData.metadata.astronomicalNight = {
                start: cachedNight.start.toISOString(),
                end: cachedNight.end.toISOString(),
                formattedTime: cachedNight.formatted
              };
            } else {
              const { start, end } = calculateAstronomicalNight(latitude, longitude);
              updatedLocationData.metadata.astronomicalNight = {
                start: start.toISOString(),
                end: end.toISOString(),
                formattedTime: nightTimeStr
              };
            }
          }
          
          // Update the SIQS result with the fresh calculation
          updatedLocationData.siqsResult = freshSIQSResult;
          setLocationData(updatedLocationData);
          
          updateAttemptedRef.current = true;
        } else if (forecastData?.hourly?.cloud_cover && locationData) {
          // If we couldn't calculate nighttime SIQS but have forecast data,
          // use our improved astronomical night cloud cover calculation
          
          // Calculate cloud cover for the astronomical night
          const tonightCloudCover = calculateTonightCloudCover(
            forecastData.hourly,
            latitude,
            longitude
          );
          
          // Convert to SIQS score
          const estimatedScore = Math.max(0, Math.min(10, 10 - (tonightCloudCover * 0.25)));
          
          console.log(`Using calculated tonight's cloud cover for SIQS (${nightTimeStr}): ${tonightCloudCover.toFixed(1)}% -> ${estimatedScore}`);
          
          const updatedLocationData = { ...locationData };
          
          // Ensure we have metadata object
          if (!updatedLocationData.metadata) {
            updatedLocationData.metadata = {};
          }
          
          // Add astronomical night data
          if (!updatedLocationData.metadata.astronomicalNight) {
            if (cachedNight) {
              updatedLocationData.metadata.astronomicalNight = {
                start: cachedNight.start.toISOString(),
                end: cachedNight.end.toISOString(),
                formattedTime: cachedNight.formatted
              };
            } else {
              const { start, end } = calculateAstronomicalNight(latitude, longitude);
              updatedLocationData.metadata.astronomicalNight = {
                start: start.toISOString(),
                end: end.toISOString(),
                formattedTime: nightTimeStr
              };
            }
          }
          
          // Update with simplified SIQS calculation
          updatedLocationData.siqsResult = {
            score: estimatedScore,
            isViable: tonightCloudCover < 40,
            factors: [
              {
                name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                score: (100 - tonightCloudCover * 2.5) / 10,
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
          };
          
          setLocationData(updatedLocationData);
          updateAttemptedRef.current = true;
        } else if (locationData.weatherData?.cloudCover !== undefined) {
          // Last fallback to current weather if forecast is unavailable
          console.log("Using current weather as fallback (no forecast data available)");
          const currentCloudCover = validateCloudCover(locationData.weatherData.cloudCover);
          
          // Special handling for 0% cloud cover - should be score 10
          const cloudScore = currentCloudCover === 0 ? 100 : Math.max(0, 100 - (currentCloudCover * 2));
          const estimatedScore = cloudScore / 10;
          
          console.log(`Using current cloud cover (${currentCloudCover}%) for SIQS: ${estimatedScore.toFixed(2)}`);
          
          const updatedLocationData = { ...locationData };
          
          // Ensure we have metadata object
          if (!updatedLocationData.metadata) {
            updatedLocationData.metadata = {};
          }
          
          // Add astronomical night data if we have coordinates
          if (!updatedLocationData.metadata.astronomicalNight && latitude && longitude) {
            const { start, end } = calculateAstronomicalNight(latitude, longitude);
            updatedLocationData.metadata.astronomicalNight = {
              start: start.toISOString(),
              end: end.toISOString(),
              formattedTime: `${formatTime(start)}-${formatTime(end)}`
            };
          }
          
          updatedLocationData.siqsResult = {
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
          
          setLocationData(updatedLocationData);
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
