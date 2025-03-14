
import React, { useMemo } from "react";
import WeatherConditions, { normalizeMoonPhase } from "@/components/WeatherConditions";
import SIQSSummary from "@/components/SIQSSummary";

interface WeatherSectionProps {
  locationData: any;
}

const WeatherSection: React.FC<WeatherSectionProps> = ({ locationData }) => {
  // Memoize the weather data to prevent unnecessary re-calculations
  const weatherData = useMemo(() => ({
    temperature: locationData?.weatherData?.temperature || 0,
    humidity: locationData?.weatherData?.humidity || 0,
    cloudCover: locationData?.weatherData?.cloudCover || 0,
    windSpeed: locationData?.weatherData?.windSpeed || 0,
    precipitation: locationData?.weatherData?.precipitation || 0,
    time: locationData?.weatherData?.time || new Date().toISOString(),
    condition: locationData?.weatherData?.condition || 
      (locationData?.weatherData ? determineWeatherCondition(locationData?.weatherData?.cloudCover || 0) : ""),
    aqi: locationData?.weatherData?.aqi
  }), [locationData?.weatherData]);

  // Format the moon phase as a human-readable string
  const moonPhaseString = useMemo(() => {
    return normalizeMoonPhase(locationData.moonPhase || 0);
  }, [locationData.moonPhase]);

  // Format the seeing conditions as a human-readable string
  const seeingConditionsString = useMemo(() => {
    const value = locationData.seeingConditions;
    if (typeof value !== 'number') return "Average";
    
    if (value <= 1) return "Excellent";
    if (value <= 2) return "Good";
    if (value <= 3) return "Average";
    if (value <= 4) return "Poor";
    return "Very Poor";
  }, [locationData.seeingConditions]);

  // Get the Bortle scale, pass null for unknown values
  const bortleScale = useMemo(() => {
    const value = locationData.bortleScale;
    if (value === undefined || value === null || value < 1 || value > 9) {
      return null;
    }
    return value;
  }, [locationData.bortleScale]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <WeatherConditions
        weatherData={weatherData}
        moonPhase={moonPhaseString}
        bortleScale={bortleScale}
        seeingConditions={seeingConditionsString}
      />
      
      <SIQSSummary
        siqsData={{
          score: locationData.siqsResult?.score || 0,
          isViable: locationData.siqsResult?.isViable || false,
          factors: locationData.siqsResult?.factors || []
        }}
      />
    </div>
  );
};

// Helper function to determine weather condition based on cloud cover
function determineWeatherCondition(cloudCover: number): string {
  if (cloudCover < 10) return "clear";
  if (cloudCover < 30) return "mostly-clear";
  if (cloudCover < 60) return "partly-cloudy";
  if (cloudCover < 90) return "mostly-cloudy";
  return "cloudy";
}

export default React.memo(WeatherSection);
