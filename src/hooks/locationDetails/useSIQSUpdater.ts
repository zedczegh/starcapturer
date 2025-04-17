
import { useCallback, useRef } from 'react';
import { calculateNighttimeSIQS, calculateTonightCloudCover } from "@/lib/siqs/utils";
import { calculateAstronomicalNight, formatTime } from "@/lib/siqs/utils";

export const useSIQSUpdater = () => {
  const siqsUpdatedRef = useRef<boolean>(false);

  const updateSIQSWithForecast = useCallback((
    locationData: any,
    forecastData: any,
    forecastLoading: boolean,
    setLocationData: (data: any) => void
  ) => {
    if (!forecastData || forecastLoading || !locationData) return false;
    
    if (!siqsUpdatedRef.current) {
      console.log("Updating SIQS score with fresh forecast data");
      
      try {
        // Extract coordinates for astronomical night calculations
        const latitude = locationData.latitude || 0;
        const longitude = locationData.longitude || 0;
        
        // Get astronomical night times for display
        const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
        const nightTimeStr = `${formatTime(nightStart)}-${formatTime(nightEnd)}`;
        
        const updatedSIQS = calculateNighttimeSIQS(locationData, forecastData, null);
        
        if (updatedSIQS) {
          console.log("Nighttime SIQS calculated:", updatedSIQS.score);
          
          // Only update if we have meaningful data (either good or bad score)
          setLocationData({
            ...locationData,
            siqsResult: updatedSIQS
          });
          
          siqsUpdatedRef.current = true;
          return true;
        } else if (forecastData?.hourly?.cloud_cover && locationData.weatherData) {
          // If we couldn't calculate nighttime SIQS but have forecast data,
          // use our improved astronomical night cloud cover calculation
          
          // Calculate cloud cover for the astronomical night
          const tonightCloudCover = calculateTonightCloudCover(forecastData.hourly, latitude, longitude);
          
          // Convert to SIQS score
          const estimatedScore = Math.max(0, Math.min(10, 10 - (tonightCloudCover * 0.25)));
          
          console.log(`Using calculated tonight's cloud cover for SIQS (${nightTimeStr}): ${tonightCloudCover.toFixed(1)}% -> ${estimatedScore}`);
          
          setLocationData({
            ...locationData,
            siqsResult: {
              score: estimatedScore,
              isViable: tonightCloudCover < 40,
              factors: [
                {
                  name: "Cloud Cover",
                  score: (100 - tonightCloudCover * 2.5) / 10,
                  description: `Tonight's cloud cover of ${tonightCloudCover.toFixed(1)}% affects imaging quality`,
                  nighttimeData: {
                    average: tonightCloudCover,
                    timeRange: nightTimeStr
                  }
                }
              ]
            }
          });
          
          siqsUpdatedRef.current = true;
          return true;
        }
      } catch (error) {
        console.error("Error updating SIQS with forecast data:", error);
      }
    }
    
    return siqsUpdatedRef.current;
  }, []);
  
  const resetUpdateState = useCallback(() => {
    siqsUpdatedRef.current = false;
  }, []);

  return { updateSIQSWithForecast, resetUpdateState, siqsUpdatedRef };
};
