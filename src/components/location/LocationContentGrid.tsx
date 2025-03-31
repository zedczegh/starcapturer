import React, { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import ForecastTabs from "@/components/forecast/ForecastTabs";
import SIQSSummary from "@/components/siqs/SIQSSummary";
import MapDisplay from "@/components/location/MapDisplay";
import CopyLocationButton from "@/components/location/CopyLocationButton";
import CloudCoverageMap from "@/components/location/CloudCoverageMap";
import WarmReminders from '@/components/weather/WarmReminders';

interface LocationContentGridProps {
  locationData: any;
  forecastData: any;
  longRangeForecast: any;
  forecastLoading: boolean;
  longRangeLoading: boolean;
  gettingUserLocation: boolean;
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  setGettingUserLocation: (getting: boolean) => void;
  setStatusMessage: (message: string | null) => void;
  onRefreshForecast: () => void;
  onRefreshLongRange: () => void;
}

const LocationContentGrid: React.FC<LocationContentGridProps> = memo(({
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
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* First column */}
      <div className="space-y-4">
        {/* Weather Info Card */}
        <div className="glass-card p-4">
          <h2 className="text-lg font-medium mb-4">
            {t("Current Weather", "当前天气")}
          </h2>
          
          <PrimaryConditions weatherData={locationData.weatherData} />
          
          <div className="mt-4">
            <SecondaryConditions weatherData={locationData.weatherData} />
          </div>
          
          {/* Add Warm Reminders component here */}
          <WarmReminders 
            locationData={locationData} 
            forecastData={forecastData} 
          />
        </div>
        
        {/* SIQS Summary */}
        <div className="glass-card p-4">
          <h2 className="text-lg font-medium mb-3">
            {t("SIQS Summary", "SIQS 摘要")}
          </h2>
          
          <SIQSSummary 
            locationData={locationData} 
            isLoading={forecastLoading}
          />
        </div>
        
        {/* Map Display */}
        <div className="glass-card p-4 overflow-hidden">
          <h2 className="text-lg font-medium mb-3">
            {t("Location Map", "位置地图")}
          </h2>
          
          <MapDisplay 
            latitude={locationData.latitude} 
            longitude={locationData.longitude} 
            name={locationData.name}
          />
          
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyLocationButton 
              latitude={locationData.latitude} 
              longitude={locationData.longitude} 
            />
          </div>
        </div>
      </div>
      
      {/* Second column */}
      <div className="space-y-4">
        {/* Weather Forecast Tabs */}
        <div className="glass-card p-4">
          <h2 className="text-lg font-medium mb-3">
            {t("Weather Forecast", "天气预报")}
          </h2>
          
          <ForecastTabs 
            forecastData={forecastData}
            longRangeForecast={longRangeForecast}
            isLoading={forecastLoading || longRangeLoading}
            onRefreshForecast={onRefreshForecast}
            onRefreshLongRange={onRefreshLongRange}
          />
        </div>
        
        {/* Cloud Coverage Map */}
        <div className="glass-card p-4">
          <h2 className="text-lg font-medium mb-3">
            {t("Cloud Coverage", "云层覆盖")}
          </h2>
          
          <CloudCoverageMap 
            latitude={locationData.latitude} 
            longitude={locationData.longitude} 
          />
        </div>
      </div>
    </div>
  );
});

LocationContentGrid.displayName = 'LocationContentGrid';

export default LocationContentGrid;
