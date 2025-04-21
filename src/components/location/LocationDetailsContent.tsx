
import React, { memo, Suspense } from "react";
import StatusMessage from "@/components/location/StatusMessage";
import LocationContentLoader from "./LocationContentLoader";
import LocationFaultedMessage from "./LocationFaultedMessage";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

const LocationContentGrid = React.lazy(() => import("./LocationContentGrid"));
import { useLocationContentManager } from "./useLocationContentManager";

interface LocationDetailsContentProps {
  locationData: any;
  setLocationData: (data: any) => void;
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  showFaultedMessage?: boolean;
}

const LocationDetailsContent = memo<LocationDetailsContentProps>(({
  locationData,
  setLocationData,
  onLocationUpdate,
  showFaultedMessage = false
}) => {
  const { t } = useLanguage();

  const {
    containerRef,
    contentLoaded,
    faulted,
    setFaulted,
    statusMessage,
    setStatusMessage,
    loading,
    memoizedLocationData,
    forecastData,
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    gettingUserLocation,
    setGettingUserLocation,
    handleRefreshForecast,
    handleRefreshLongRangeForecast,
    onLocationUpdate: onLocUpdate,
    resetUpdateState
  } = useLocationContentManager(locationData, setLocationData, onLocationUpdate);

  // Fix for cases where SIQS is unavailable – show manual refresh button when loaded but no SIQS
  const shouldShowManualRefresh = 
    memoizedLocationData &&
    !loading &&
    contentLoaded &&
    (!memoizedLocationData.siqsResult || typeof memoizedLocationData.siqsResult.score !== "number");

  const handleManualRefresh = () => {
    resetUpdateState();
    if (locationData?.latitude && locationData?.longitude) {
      handleRefreshForecast(locationData.latitude, locationData.longitude);
      handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
    }
  };

  if (!memoizedLocationData) {
    return (
      <div className="p-8 text-center">
        <Loader className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p>{t("Loading location data...", "正在加载位置数据...")}</p>
      </div>
    );
  }

  if (faulted && showFaultedMessage) {
    return <LocationFaultedMessage show />;
  }

  return (
    <div className="transition-all duration-300 animate-fade-in" ref={containerRef}>
      <StatusMessage 
        message={statusMessage} 
        onClear={() => setStatusMessage(null)} 
      />

      {shouldShowManualRefresh && (
        <div className="flex justify-center mb-4">
          <Button variant="outline" onClick={handleManualRefresh}>
            {t("Manually Refresh Data", "手动刷新数据")}
          </Button>
        </div>
      )}

      {loading || !contentLoaded ? (
        <LocationContentLoader />
      ) : (
        <Suspense fallback={<LocationContentLoader />}>
          <LocationContentGrid 
            locationData={memoizedLocationData}
            forecastData={forecastData}
            longRangeForecast={longRangeForecast}
            forecastLoading={forecastLoading}
            longRangeLoading={longRangeLoading}
            gettingUserLocation={gettingUserLocation}
            onLocationUpdate={onLocUpdate}
            setGettingUserLocation={setGettingUserLocation}
            setStatusMessage={setStatusMessage}
            onRefreshForecast={() => {
              if (memoizedLocationData?.latitude && memoizedLocationData?.longitude) {
                handleRefreshForecast(memoizedLocationData.latitude, memoizedLocationData.longitude);
              }
            }}
            onRefreshLongRange={() => {
              if (memoizedLocationData?.latitude && memoizedLocationData?.longitude) {
                handleRefreshLongRangeForecast(memoizedLocationData.latitude, memoizedLocationData.longitude);
              }
            }}
          />
        </Suspense>
      )}
    </div>
  );
});

LocationDetailsContent.displayName = 'LocationDetailsContent';

export default LocationDetailsContent;
