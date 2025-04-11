
import { useEffect, useRef, useCallback } from 'react';
import { calculateNighttimeSiqs } from '@/utils/nighttimeSIQS';
import { toast } from 'sonner';
import { validateCloudCover } from '@/utils/siqs/cloudCoverUtils';
import { getConsistentSiqsValue } from '@/utils/nighttimeSIQS';
import { currentSiqsStore } from '@/components/index/CalculatorSection';

// Extend window type to include our global store
declare global {
  interface Window {
    currentSiqsStore?: typeof currentSiqsStore;
  }
}

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
  const forceUpdateRef = useRef(true); // Changed to true to ensure initial update happens
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
    
    // Updated condition: Force update on first load, when forecast data changes, or when explicitly requested
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
          
          // Also update localStorage with the latest SIQS score for global accessibility
          try {
            const latestLocationData = {
              name: locationData.name,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              bortleScale: locationData.bortleScale,
              siqs: freshSIQSResult.score,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem('latest_siqs_location', JSON.stringify(latestLocationData));
            
            // Update current SIQS store if it exists in window
            if (window.currentSiqsStore) {
              window.currentSiqsStore.setValue(freshSIQSResult.score);
            }
          } catch (err) {
            console.error("Failed to update localStorage with SIQS:", err);
          }
          
          updateAttemptedRef.current = true;
        } else if (locationData.weatherData?.cloudCover !== undefined) {
          // Fallback to current weather if nighttime forecast is unavailable
          console.log("Using fallback SIQS calculation based on current weather");
          const currentCloudCover = validateCloudCover(locationData.weatherData.cloudCover);
          
          // Calculate SIQS primarily based on cloud cover
          const siqs = Math.min(10, Math.max(0, 10 - (currentCloudCover * 0.1)));
          
          console.log(`Using current cloud cover (${currentCloudCover}%) for SIQS: ${siqs.toFixed(2)}`);
          
          const fallbackResult = {
            score: siqs,
            isViable: siqs > 5,
            factors: [
              {
                name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                score: Math.min(10, Math.max(0, 10 - (currentCloudCover * 0.1))),
                description: t 
                  ? t(`Cloud cover of ${currentCloudCover}% affects imaging quality`, 
                    `${currentCloudCover}%的云量影响成像质量`) 
                  : `Cloud cover of ${currentCloudCover}% affects imaging quality`
              }
            ]
          };
          
          setLocationData({
            ...locationData,
            siqs: siqs,
            siqsResult: fallbackResult
          });
          
          // Also update localStorage for global accessibility
          try {
            const latestLocationData = {
              name: locationData.name,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              bortleScale: locationData.bortleScale,
              siqs: siqs,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem('latest_siqs_location', JSON.stringify(latestLocationData));
            
            // Update current SIQS store if it exists in window
            if (window.currentSiqsStore) {
              window.currentSiqsStore.setValue(siqs);
            }
          } catch (err) {
            console.error("Failed to update localStorage with SIQS:", err);
          }
          
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
        
        // Update localStorage with the consistent value
        try {
          const storedLocation = localStorage.getItem('latest_siqs_location');
          if (storedLocation) {
            const parsedLocation = JSON.parse(storedLocation);
            if (parsedLocation.latitude === locationData.latitude && 
                parsedLocation.longitude === locationData.longitude) {
              parsedLocation.siqs = consistentSiqs;
              localStorage.setItem('latest_siqs_location', JSON.stringify(parsedLocation));
              
              // Update current SIQS store if it exists in window
              if (window.currentSiqsStore) {
                window.currentSiqsStore.setValue(consistentSiqs);
              }
            }
          }
        } catch (err) {
          console.error("Failed to update localStorage with consistent SIQS:", err);
        }
      }
    }
  }, [forecastData, locationData, setLocationData, t, resetUpdateState]);
  
  return { 
    resetUpdateState,
    isNighttimeCalculated: nighttimeCalculatedRef.current
  };
};
