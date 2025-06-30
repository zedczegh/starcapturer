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
import MobileSection from "@/components/ui/mobile-section";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
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

  const clearSkyRate = useMemo(() => {
    return locationData?.clearSkyData?.annualRate || 60;
  }, [locationData?.clearSkyData]);

  const monthlyRates = useMemo(() => {
    return locationData?.clearSkyData?.monthlyRates || {};
  }, [locationData?.clearSkyData]);

  const clearestMonths = useMemo(() => {
    return locationData?.historicalData?.clearestMonths || [];
  }, [locationData?.historicalData]);

  return (
    <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6 lg:gap-8'} transition-all`}>
      <div className="space-y-4 lg:space-y-6">
        <MobileSection>
          <WeatherConditions
            weatherData={weatherData}
            moonPhase={moonPhaseString}
            bortleScale={bortleScale}
            seeingConditions={seeingConditionsString}
            forecastData={forecastData}
          />
        </MobileSection>
        
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
          <MobileSection padding="sm">
            <ClearSkyRateDisplay 
              latitude={locationData.latitude} 
              longitude={locationData.longitude}
              clearSkyRate={clearSkyRate}
              monthlyRates={monthlyRates}
              clearestMonths={clearestMonths}
            />
          </MobileSection>
          <MobileSection padding="sm">
            <MoonlessNightDisplay
              latitude={locationData.latitude}
              longitude={locationData.longitude}
            />
          </MobileSection>
        </div>
        
        <MobileSection>
          <SIQSSummary
            siqsResult={locationData.siqsResult || null}
            weatherData={weatherData}
            locationData={locationData}
          />
        </MobileSection>
      </div>
      
      <div className="space-y-4 lg:space-y-6">
        <MobileSection className="relative z-60">
          <LocationUpdater 
            locationData={locationData}
            onLocationUpdate={onLocationUpdate}
            gettingUserLocation={gettingUserLocation}
            setGettingUserLocation={setGettingUserLocation}
            setStatusMessage={setStatusMessage}
          />
        </MobileSection>
        
        <MobileSection>
          <ForecastTabs
            forecastData={forecastData}
            longRangeForecast={longRangeForecast}
            forecastLoading={forecastLoading}
            longRangeLoading={longRangeLoading}
            onRefreshForecast={onRefreshForecast}
            onRefreshLongRange={onRefreshLongRange}
          />
        </MobileSection>
      </div>
    </div>
  );
};

export default LocationContentGrid;
