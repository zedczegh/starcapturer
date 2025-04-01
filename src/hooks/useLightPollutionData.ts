
import { fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";

export const useLightPollutionData = () => {
  const updateLightPollutionData = async (
    locationData: any, 
    setLocationData: (data: any) => void
  ) => {
    if (!locationData || !locationData.latitude || !locationData.longitude) return;
    
    try {
      const bortleData = await fetchLightPollutionData(
        locationData.latitude, 
        locationData.longitude
      );
      
      // Only update if we have a valid Bortle scale value
      if (bortleData && typeof bortleData.bortleScale === 'number' && 
          bortleData.bortleScale >= 1 && bortleData.bortleScale <= 9 && 
          bortleData.bortleScale !== locationData.bortleScale) {
        
        const updatedLocationData = {
          ...locationData,
          bortleScale: bortleData.bortleScale
        };
        
        // Recalculate SIQS with new Bortle scale if we have the required data
        if (locationData.weatherData && locationData.moonPhase !== undefined) {
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
        } else {
          setLocationData(updatedLocationData);
        }
      } else if (bortleData && bortleData.bortleScale === null && locationData.bortleScale !== null) {
        // Update to show unknown Bortle scale if needed
        setLocationData({
          ...locationData,
          bortleScale: null
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
