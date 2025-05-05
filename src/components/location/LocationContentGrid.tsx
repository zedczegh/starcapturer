import React, { useMemo } from "react";
import SIQSSummary from "@/components/SIQSSummary";
import WeatherConditions from "@/components/WeatherConditions";
import { normalizeMoonPhase } from "@/utils/weather/moonPhaseUtils";
import LocationUpdater from "@/components/location/LocationUpdater";
import { determineWeatherCondition } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import ClearSkyRateDisplay from "./ClearSkyRateDisplay";
import MoonlessNightDisplay from "./MoonlessNightDisplay";
import ForecastTabs from "./ForecastTabs";

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
  const { language } = useLanguage();
  
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

  const moonPhaseString = useMemo(() => {
    return normalizeMoonPhase(locationData.moonPhase || 0);
  }, [locationData.moonPhase]);

  const seeingConditionsString = useMemo(() => {
    const value = locationData.seeingConditions;
    if (typeof value !== 'number') return "Average";
    
    if (value <= 1) return "Excellent";
    if (value <= 2) return "Good";
    if (value <= 3) return "Average";
    if (value <= 4) return "Poor";
    return "Very Poor";
  }, [locationData.seeingConditions]);

  const bortleScale = useMemo(() => {
    const value = locationData.bortleScale;
    if (value === undefined || value === null || value < 1 || value > 9) {
      return null;
    }
    return value;
  }, [locationData.bortleScale]);

  const loadingText = useMemo(() => {
    return language === 'en' ? "Loading..." : "加载中...";
  }, [language]);

  // Get clear sky rate from location data
  const clearSkyRate = useMemo(() => {
    return locationData?.clearSkyData?.annualRate || 60;
  }, [locationData?.clearSkyData]);

  // Get monthly rates from location data
  const monthlyRates = useMemo(() => {
    return locationData?.clearSkyData?.monthlyRates || {};
  }, [locationData?.clearSkyData]);

  // Get clearest months from historical data
  const clearestMonths = useMemo(() => {
    return locationData?.historicalData?.clearestMonths || [];
  }, [locationData?.historicalData]);

  // Handle refreshing weather data
  const handleRefreshWeather = () => {
    if (locationData?.latitude && locationData?.longitude) {
      onRefreshForecast();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 transition-all">
      <div className="lg:col-span-7 space-y-5">
        <div className="panel-container">
          <WeatherConditions
            weatherData={weatherData}
            moonPhase={moonPhaseString}
            bortleScale={bortleScale}
            seeingConditions={seeingConditionsString}
            forecastData={forecastData}
            latitude={locationData?.latitude}
            longitude={locationData?.longitude}
            onRefresh={handleRefreshWeather}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="panel-container">
            <ClearSkyRateDisplay 
              latitude={locationData.latitude} 
              longitude={locationData.longitude}
              clearSkyRate={clearSkyRate}
              monthlyRates={monthlyRates}
              clearestMonths={clearestMonths}
            />
          </div>
          <div className="panel-container">
            <MoonlessNightDisplay
              latitude={locationData.latitude}
              longitude={locationData.longitude}
            />
          </div>
        </div>
        
        <div className="panel-container">
          <SIQSSummary
            siqsResult={locationData.siqsResult || null}
            weatherData={weatherData}
            locationData={locationData}
          />
        </div>
      </div>
      
      <div className="lg:col-span-5 space-y-5">
        <div className="panel-container relative z-60">
          <LocationUpdater 
            locationData={locationData}
            onLocationUpdate={onLocationUpdate}
            gettingUserLocation={gettingUserLocation}
            setGettingUserLocation={setGettingUserLocation}
            setStatusMessage={setStatusMessage}
          />
        </div>
        
        <div className="panel-container">
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
    </div>
  );
};

export default LocationContentGrid;
