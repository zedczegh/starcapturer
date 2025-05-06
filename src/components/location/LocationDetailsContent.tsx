
import React, { memo, Suspense, useEffect, useState, useCallback } from "react";
import StatusMessage from "@/components/location/StatusMessage";
import LocationContentLoader from "./LocationContentLoader";
import LocationFaultedMessage from "./LocationFaultedMessage";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Lazy load the grid component for faster initial load
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
  const [contentVisible, setContentVisible] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    
    // Reset visibility when loading changes
    if (loading) {
      setContentVisible(false);
    }
    
    return undefined;
  }, [loading, contentLoaded]);

  // Handle Suspense errors
  const handleContentError = useCallback((error: Error) => {
    console.error("Error loading content grid:", error);
    setLoadError(`Failed to load content: ${error.message}`);
    setFaulted(true);
  }, [setFaulted]);

  // Fix for cases where SIQS is unavailable – show manual refresh button when loaded but no SIQS
  const shouldShowManualRefresh = 
    memoizedLocationData &&
    !loading &&
    contentLoaded &&
    (!memoizedLocationData.siqsResult || typeof memoizedLocationData.siqsResult.score !== "number");

  const handleManualRefresh = useCallback(() => {
    resetUpdateState();
    setLoadError(null);
    
    if (locationData?.latitude && locationData?.longitude) {
      toast.info(t("Refreshing location data...", "正在刷新位置数据..."));
      handleRefreshForecast(locationData.latitude, locationData.longitude);
      handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
    }
  }, [locationData, handleRefreshForecast, handleRefreshLongRangeForecast, resetUpdateState, t]);

  if (!memoizedLocationData) {
    return (
      <div className="p-8 text-center">
        <Loader className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p>{t("Loading location data...", "正在加载位置数据...")}</p>
      </div>
    );
  }

  if ((faulted && showFaultedMessage) || loadError) {
    return (
      <>
        <LocationFaultedMessage show />
        {loadError && (
          <div className="mt-4 text-center">
            <p className="text-red-400 mb-4">{loadError}</p>
            <Button variant="outline" onClick={handleManualRefresh}>
              {t("Try Again", "重试")}
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`transition-all duration-300 ${contentVisible ? 'opacity-100' : 'opacity-0'}`} ref={containerRef}>
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
