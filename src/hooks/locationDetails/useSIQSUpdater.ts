
import { useCallback, useRef } from 'react';
import { calculateNighttimeSIQS } from "@/utils/nighttimeSIQS";

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
        } else if (locationData.weatherData) {
          // If cloud cover is low but we couldn't calculate nighttime SIQS,
          // update with a fallback calculation
          const cloudCover = locationData.weatherData.cloudCover;
          if (cloudCover < 40) {
            const estimatedScore = Math.max(0, Math.min(10, 10 - (cloudCover * 0.25)));
            console.log("Using fallback SIQS based on current cloud cover:", estimatedScore);
            
            setLocationData({
              ...locationData,
              siqsResult: {
                score: estimatedScore,
                isViable: true,
                factors: [
                  {
                    name: "Cloud Cover",
                    score: (100 - cloudCover * 2.5),
                    description: `Cloud cover of ${cloudCover}% is good for imaging`
                  }
                ]
              }
            });
            
            siqsUpdatedRef.current = true;
            return true;
          }
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
