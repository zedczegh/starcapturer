
import React from "react";
import SIQSSummary from "@/components/SIQSSummary";
import WeatherConditions from "@/components/WeatherConditions";
import LocationUpdater from "@/components/location/LocationUpdater";
import ForecastTabs from "@/components/location/ForecastTabs";
import { determineWeatherCondition } from "@/lib/api";
import { calculateMoonPhase } from "@/utils/siqsValidation";

interface LocationContentProps {
  locationData: any;
  forecastData: any;
  longRangeForecast: any;
  forecastLoading: boolean;
  longRangeLoading: boolean;
  gettingUserLocation: boolean;
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  setGettingUserLocation: (value: boolean) => void;
  setStatusMessage: (message: string | null) => void;
  onRefreshForecast: () => void;
  onRefreshLongRange: () => void;
}

const LocationContent: React.FC<LocationContentProps> = ({
  locationData,
  forecastData,
  longRangeForecast,
  forecastLoading,
  longRangeLoading,
  gettingUserLocation,
  onLocationUpdate,
  setGettingUserLocation,
  setStatusMessage,
  onRefreshForecast,
  onRefreshLongRange
}) => {
  // Get real-time moon phase
  const currentMoonPhase = calculateMoonPhase();
  
  // Calculate real-time seeing conditions based on weather data
  const calculateSeeingConditions = () => {
    const { humidity = 50, windSpeed = 10, cloudCover = 30 } = locationData?.weatherData || {};
    
    // Higher humidity, wind speed, and cloud cover all negatively affect seeing conditions
    let seeingValue = 2; // Start with default "Good"
    
    if (humidity > 85) seeingValue += 1;
    if (windSpeed > 15) seeingValue += 1;
    if (cloudCover > 30) seeingValue += 0.5;
    
    // Clamp value between 1-5
    return Math.max(1, Math.min(5, seeingValue));
  };
  
  // Get real-time seeing conditions
  const realTimeSeeingValue = calculateSeeingConditions();
  
  // Format helpers for the UI
  const formatMoonPhase = (phase: number) => {
    if (phase <= 0.05 || phase >= 0.95) return "New Moon";
    if (phase < 0.25) return "Waxing Crescent";
    if (phase < 0.30) return "First Quarter";
    if (phase < 0.45) return "Waxing Gibbous";
    if (phase < 0.55) return "Full Moon";
    if (phase < 0.70) return "Waning Gibbous";
    if (phase < 0.80) return "Last Quarter";
    return "Waning Crescent";
  };

  const formatSeeingConditions = (value: number) => {
    if (value <= 1) return "Excellent";
    if (value <= 2) return "Good";
    if (value <= 3) return "Average";
    if (value <= 4) return "Poor";
    return "Very Poor";
  };
  
  const weatherData = {
    temperature: locationData?.weatherData?.temperature || 0,
    humidity: locationData?.weatherData?.humidity || 0,
    cloudCover: locationData?.weatherData?.cloudCover || 0,
    windSpeed: locationData?.weatherData?.windSpeed || 0,
    precipitation: locationData?.weatherData?.precipitation || 0,
    time: locationData?.weatherData?.time || new Date().toISOString(),
    condition: locationData?.weatherData?.condition || 
      determineWeatherCondition(locationData?.weatherData?.cloudCover || 0),
    aqi: locationData?.weatherData?.aqi
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        <SIQSSummary
          siqs={locationData.siqsResult?.score || 0}
          factors={locationData.siqsResult?.factors || []}
          isViable={locationData.siqsResult?.isViable || false}
        />
        
        <WeatherConditions
          weatherData={weatherData}
          moonPhase={formatMoonPhase(currentMoonPhase)}
          bortleScale={locationData.bortleScale || 4}
          seeingConditions={formatSeeingConditions(realTimeSeeingValue)}
        />
      </div>
      
      <div className="space-y-8">
        <div className="relative z-60">
          <LocationUpdater 
            locationData={locationData}
            onLocationUpdate={onLocationUpdate}
            gettingUserLocation={gettingUserLocation}
            setGettingUserLocation={setGettingUserLocation}
            setStatusMessage={setStatusMessage}
          />
        </div>
        
        <ForecastTabs 
          forecastData={forecastData}
          longRangeForecast={longRangeForecast}
          forecastLoading={forecastLoading}
          longRangeLoading={longRangeLoading}
          onRefreshForecast={onRefreshForecast}
          onRefreshLongRange={onRefreshLongRange}
        />
      </div>
    </div>
  );
};

export default LocationContent;
