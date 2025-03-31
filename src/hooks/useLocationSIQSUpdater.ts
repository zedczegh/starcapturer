
import { useEffect, useRef } from 'react';
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
  
  // Update SIQS score when forecast data becomes available
  useEffect(() => {
    // Only update SIQS once when the forecast data is available
    if (
      forecastData?.hourly && 
      Array.isArray(forecastData.hourly.time) &&
      forecastData.hourly.time.length > 0 &&
      locationData
    ) {
      console.log("Updating SIQS based on hourly forecast data");
      
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
          const currentCloudCover = locationData.weatherData.cloudCover;
          
          if (currentCloudCover < 40) {
            // Simple formula: 10 - (cloudCover * 0.25) for clear skies
            const estimatedScore = Math.max(0, Math.min(10, 10 - (currentCloudCover * 0.25)));
            
            console.log(`Using current cloud cover (${currentCloudCover}%) for SIQS: ${estimatedScore}`);
            
            setLocationData({
              ...locationData,
              siqsResult: {
                score: estimatedScore,
                isViable: true,
                factors: [
                  {
                    name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                    score: Math.round((100 - currentCloudCover * 2.5) * 10) / 10,
                    description: t ? 
                      t(`Cloud cover of ${currentCloudCover}% is good for imaging`, 
                        `${currentCloudCover}%的云量适合成像`) : 
                      `Cloud cover of ${currentCloudCover}% is good for imaging`
                  }
                ]
              }
            });
            
            updateAttemptedRef.current = true;
          } else {
            console.log(`Current cloud cover (${currentCloudCover}%) too high for imaging`);
            setLocationData({
              ...locationData,
              siqsResult: {
                score: 0,
                isViable: false,
                factors: [
                  {
                    name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
                    score: 0,
                    description: t ? 
                      t(`Cloud cover of ${currentCloudCover}% makes imaging impossible`, 
                        `${currentCloudCover}%的云量使成像不可能`) : 
                      `Cloud cover of ${currentCloudCover}% makes imaging impossible`
                  }
                ]
              }
            });
            
            updateAttemptedRef.current = true;
          }
        }
      } catch (error) {
        console.error("Error updating SIQS with forecast data:", error);
        toast.error(t ? t("Error updating SIQS score", "更新SIQS评分时出错") : "Error updating SIQS score");
      }
    }
  }, [forecastData, locationData, setLocationData, t]);
  
  // Method to reset the update flag when new location data is loaded
  const resetUpdateState = () => {
    updateAttemptedRef.current = false;
  };
  
  return { resetUpdateState };
};
