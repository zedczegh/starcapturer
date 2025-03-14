
import React, { useMemo, lazy, Suspense } from "react";
import SIQSSummary from "@/components/SIQSSummary";
import WeatherConditions, { normalizeMoonPhase } from "@/components/WeatherConditions";
import LocationUpdater from "@/components/location/LocationUpdater";
import { determineWeatherCondition } from "@/lib/api";

// Lazy load the forecast tabs to improve initial load time
const ForecastTabs = lazy(() => import("@/components/location/ForecastTabs"));

interface LocationContentGridProps {
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

const LocationContentGrid: React.FC<LocationContentGridProps> = ({
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
  // Memoize the weather data to prevent unnecessary re-calculations
  const weatherData = useMemo(() => ({
    temperature: locationData?.weatherData?.temperature || 0,
    humidity: locationData?.weatherData?.humidity || 0,
    cloudCover: locationData?.weatherData?.cloudCover || 0,
    windSpeed: locationData?.weatherData?.windSpeed || 0,
    precipitation: locationData?.weatherData?.precipitation || 0,
    time: locationData?.weatherData?.time || new Date().toISOString(),
    condition: locationData?.weatherData?.condition || 
      determineWeatherCondition(locationData?.weatherData?.cloudCover || 0),
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 transition-all">
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
      
      <div className="space-y-6 lg:space-y-8">
        <div className="relative z-60">
          <LocationUpdater 
            locationData={locationData}
            onLocationUpdate={onLocationUpdate}
            gettingUserLocation={gettingUserLocation}
            setGettingUserLocation={setGettingUserLocation}
            setStatusMessage={setStatusMessage}
          />
        </div>
        
        <Suspense fallback={<div className="animate-pulse h-64 bg-slate-800/20 rounded-lg"></div>}>
          <ForecastTabs 
            forecastData={forecastData}
            longRangeForecast={longRangeForecast}
            forecastLoading={forecastLoading}
            longRangeLoading={longRangeLoading}
            onRefreshForecast={onRefreshForecast}
            onRefreshLongRange={onRefreshLongRange}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default React.memo(LocationContentGrid);
