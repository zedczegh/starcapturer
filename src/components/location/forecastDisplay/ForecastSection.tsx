
import React, { lazy, Suspense } from "react";

// Lazy load the forecast tabs to improve initial load time
const ForecastTabs = lazy(() => import("@/components/location/ForecastTabs"));

interface ForecastSectionProps {
  forecastData: any;
  longRangeForecast: any;
  forecastLoading: boolean;
  longRangeLoading: boolean;
  onRefreshForecast: () => void;
  onRefreshLongRange: () => void;
}

const ForecastSection: React.FC<ForecastSectionProps> = ({
  forecastData,
  longRangeForecast,
  forecastLoading,
  longRangeLoading,
  onRefreshForecast,
  onRefreshLongRange
}) => {
  return (
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
  );
};

export default React.memo(ForecastSection);
