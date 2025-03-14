
import React from "react";
import LocationUpdater from "@/components/location/LocationUpdater";
import WeatherSection from "@/components/location/weatherDisplay/WeatherSection";
import ForecastSection from "@/components/location/forecastDisplay/ForecastSection";

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 transition-all">
      <WeatherSection locationData={locationData} />
      
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
        
        <ForecastSection 
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

export default React.memo(LocationContentGrid);
