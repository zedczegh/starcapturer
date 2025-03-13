
import { fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";

export const useLightPollutionData = () => {
  const updateLightPollutionData = async (
    locationData: any, 
    setLocationData: (data: any) => void
  ) => {
    if (!locationData) return;
    
    try {
      const bortleData = await fetchLightPollutionData(
        locationData.latitude, 
        locationData.longitude
      );
      
      if (bortleData && bortleData.bortleScale !== locationData.bortleScale) {
        const updatedLocationData = {
          ...locationData,
          bortleScale: bortleData.bortleScale
        };
        
        const moonPhase = locationData.moonPhase || 0;
        const siqsResult = calculateSIQS({
          cloudCover: locationData.weatherData.cloudCover,
          bortleScale: bortleData.bortleScale,
          seeingConditions: locationData.seeingConditions || 3,
          windSpeed: locationData.weatherData.windSpeed,
          humidity: locationData.weatherData.humidity,
          moonPhase,
          precipitation: locationData.weatherData.precipitation,
          weatherCondition: locationData.weatherData.weatherCondition,
          aqi: locationData.weatherData.aqi
        });
        
        setLocationData({
          ...updatedLocationData,
          siqsResult
        });
      }
    } catch (error) {
      console.error("Error updating light pollution data:", error);
      // Silent failure for light pollution updates - use existing data
    }
  };

  return {
    updateLightPollutionData
  };
};
