import React from "react";
import ForecastTabs from "./ForecastTabs";
import { Separator } from "@/components/ui/separator";

interface LocationContentGridProps {
  locationData: any;
  forecastData: any;
  longRangeForecast: any;
  forecastLoading: boolean;
  longRangeLoading: boolean;
  gettingUserLocation?: boolean;
  onLocationUpdate: (location: any) => Promise<void>;
  setGettingUserLocation?: (value: boolean) => void;
  setStatusMessage?: (message: string | null) => void;
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
    <div className="grid grid-cols-1 gap-8">
      {/* Weather Forecast Section */}
      <div className="mb-6">
        <ForecastTabs
          forecastData={forecastData}
          longRangeForecast={longRangeForecast}
          forecastLoading={forecastLoading}
          longRangeLoading={longRangeLoading}
          onRefreshForecast={onRefreshForecast}
          onRefreshLongRange={onRefreshLongRange}
          locationData={locationData}
        />
      </div>
      
      <Separator className="my-4 opacity-30" />
      
      {/* Other location content can go here */}
    </div>
  );
};

export default LocationContentGrid;
