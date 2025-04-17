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
        } else if (forecastData?.hourly?.cloud_cover && locationData.weatherData) {
          // If we couldn't calculate nighttime SIQS but have forecast data,
          // use a simplified approach based on forecast cloud cover
          const currentHour = new Date().getHours();
          let relevantHours = [];
          
          // If current time is already nighttime, use only future hours
          if (currentHour >= 18 || currentHour < 7) {
            // Find the index of the current hour in the forecast
            const now = new Date();
            const currentTimeIndex = forecastData.hourly.time.findIndex((time: string) => {
              const forecastTime = new Date(time);
              return forecastTime.getHours() === now.getHours() && 
                     forecastTime.getDate() === now.getDate();
            });
            
            if (currentTimeIndex !== -1) {
              // Get all future nighttime hours (after current time until 7AM)
              for (let i = currentTimeIndex; i < forecastData.hourly.time.length; i++) {
                const hour = new Date(forecastData.hourly.time[i]).getHours();
                if (hour >= 18 || hour < 7) {
                  relevantHours.push(forecastData.hourly.cloud_cover[i] || 0);
                }
                
                // Stop if we reach 7AM the next day
                if (hour === 7 && i > currentTimeIndex) {
                  break;
                }
              }
            }
          } 
          // Otherwise use all nighttime hours from 18:00-7:00
          else {
            // Find the upcoming night (starting at 18:00 today)
            for (let i = 0; i < forecastData.hourly.time.length; i++) {
              const forecastTime = new Date(forecastData.hourly.time[i]);
              const hour = forecastTime.getHours();
              const isToday = forecastTime.getDate() === new Date().getDate();
              const isTomorrow = forecastTime.getDate() === new Date().getDate() + 1;
              
              if ((isToday && hour >= 18) || (isTomorrow && hour < 7)) {
                relevantHours.push(forecastData.hourly.cloud_cover[i] || 0);
              }
            }
          }
          
          // Calculate average cloud cover for the night
          const avgCloudCover = relevantHours.length > 0 
            ? relevantHours.reduce((sum, val) => sum + val, 0) / relevantHours.length 
            : locationData.weatherData.cloudCover;
          
          // Convert to SIQS score
          const estimatedScore = Math.max(0, Math.min(10, 10 - (avgCloudCover * 0.25)));
          
          console.log("Using calculated tonight's cloud cover for SIQS:", avgCloudCover, "->", estimatedScore);
          
          setLocationData({
            ...locationData,
            siqsResult: {
              score: estimatedScore,
              isViable: avgCloudCover < 40,
              factors: [
                {
                  name: "Cloud Cover",
                  score: (100 - avgCloudCover * 2.5) / 10,
                  description: `Tonight's cloud cover of ${avgCloudCover.toFixed(1)}% affects imaging quality`,
                  nighttimeData: {
                    average: avgCloudCover,
                    timeRange: "18:00-7:00"
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
