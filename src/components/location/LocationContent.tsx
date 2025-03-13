
import React from "react";
import SIQSSummary from "@/components/SIQSSummary";
import WeatherConditions from "@/components/WeatherConditions";
import LocationUpdater from "@/components/location/LocationUpdater";
import ForecastTabs from "@/components/location/ForecastTabs";
import { determineWeatherCondition } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { language } = useLanguage();
  
  // Format helpers for the UI
  const formatMoonPhase = (phase: number) => {
    if (typeof phase !== 'number') return "Unknown";
    
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
    if (typeof value !== 'number') return "Average";
    
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
          moonPhase={formatMoonPhase(locationData.moonPhase || 0)}
          bortleScale={locationData.bortleScale || 4}
          seeingConditions={formatSeeingConditions(locationData.seeingConditions || 3)}
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
