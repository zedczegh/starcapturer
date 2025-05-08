
import React, { memo, useEffect, useState, useRef } from "react";
import StatusMessage from "@/components/location/StatusMessage";
import LocationContentLoader from "./LocationContentLoader";
import LocationFaultedMessage from "./LocationFaultedMessage";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocationContentGrid from "./LocationContentGrid";
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
  const [contentVisible, setContentVisible] = useState(false);
  const retryCount = useRef(0);
  const [isRetrying, setIsRetrying] = useState(false);

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

  // Fade in content for smoother loading experience
  useEffect(() => {
    if (!loading && contentLoaded) {
      // Small delay to allow browser painting to complete
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loading, contentLoaded]);

  // Fix for cases where SIQS is unavailable – show manual refresh button when loaded but no SIQS
  const shouldShowManualRefresh = 
    memoizedLocationData &&
    !loading &&
    contentLoaded &&
    (!memoizedLocationData.siqsResult || typeof memoizedLocationData.siqsResult.score !== "number");

  const handleManualRefresh = () => {
    resetUpdateState();
    setIsRetrying(true);
    retryCount.current += 1;
    
    if (locationData?.latitude && locationData?.longitude) {
      console.log(`Manually refreshing data (attempt ${retryCount.current})`);
      handleRefreshForecast(locationData.latitude, locationData.longitude);
      handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
      
      // Reset retry state after a delay
      setTimeout(() => {
        setIsRetrying(false);
      }, 2000);
    }
  };

  // Automatically retry loading data if it fails initially
  useEffect(() => {
    if (faulted && retryCount.current === 0 && !isRetrying) {
      console.log("Initial load failed, attempting automatic retry");
      const timer = setTimeout(() => {
        handleManualRefresh();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [faulted]);

  if (!memoizedLocationData) {
    return (
      <div className="p-8 text-center">
        <Loader className="mx-auto mb-4 h-8 w-8 animate-spin" />
        <p>{t("Loading location data...", "正在加载位置数据...")}</p>
      </div>
    );
  }

  if (faulted && showFaultedMessage) {
    return (
      <div className="p-8 text-center">
        <LocationFaultedMessage show />
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={handleManualRefresh}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {t("Retrying...", "重试中...")}
            </>
          ) : (
            t("Retry Loading Data", "重试加载数据")
          )}
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`transition-all duration-300 ${contentVisible ? 'opacity-100' : 'opacity-0'}`} 
      ref={containerRef}
      data-location-id={locationData?.id}
    >
      <StatusMessage 
        message={statusMessage} 
        onClear={() => setStatusMessage(null)} 
      />

      {shouldShowManualRefresh && (
        <div className="mb-4 flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleManualRefresh}
            disabled={isRetrying}
            className="flex items-center gap-2"
          >
            {isRetrying ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t("Manually Refresh Data", "手动刷新数据")}
          </Button>
        </div>
      )}

      {loading || !contentLoaded ? (
        <LocationContentLoader />
      ) : (
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
      )}
    </div>
  );
});

LocationDetailsContent.displayName = 'LocationDetailsContent';

export default LocationDetailsContent;
