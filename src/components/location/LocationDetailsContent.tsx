
import React, { memo, Suspense, useEffect, useState, useRef } from "react";
import StatusMessage from "@/components/location/StatusMessage";
import LocationContentLoader from "./LocationContentLoader";
import LocationFaultedMessage from "./LocationFaultedMessage";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import the component directly instead of lazy loading it
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
  const [contentMounted, setContentMounted] = useState(false);
  const retryCount = useRef(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const loadStateTimerRef = useRef<number | null>(null);

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

  // Improved loading state management with faster transitions
  useEffect(() => {
    if (!loading && contentLoaded && memoizedLocationData) {
      // Mark as mounted first to prevent unmounting during state changes
      setContentMounted(true);
      
      // Reduced delay for faster visible content
      if (loadStateTimerRef.current) {
        clearTimeout(loadStateTimerRef.current);
      }
      
      // Use requestAnimationFrame for smoother transitions
      loadStateTimerRef.current = window.setTimeout(() => {
        if (contentRef.current) {
          // Use requestAnimationFrame for better performance
          requestAnimationFrame(() => {
            setContentVisible(true);
          });
        }
      }, 50); // Reduced from 150ms to 50ms for faster display
      
      return () => {
        if (loadStateTimerRef.current) {
          clearTimeout(loadStateTimerRef.current);
        }
      };
    }
    return undefined;
  }, [loading, contentLoaded, memoizedLocationData]);

  // Keep mounted content visible even during prop changes
  useEffect(() => {
    if (contentMounted && memoizedLocationData) {
      // This ensures the component doesn't unmount during updates
      return () => {
        // Clean up only when truly unmounting
      };
    }
    
    return () => {
      if (loadStateTimerRef.current) {
        clearTimeout(loadStateTimerRef.current);
      }
    };
  }, [contentMounted, memoizedLocationData]);

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

  // Automatically retry loading data if it fails initially (once)
  useEffect(() => {
    if (faulted && retryCount.current === 0 && !isRetrying) {
      console.log("Initial load failed, attempting automatic retry");
      const timer = setTimeout(() => {
        handleManualRefresh();
      }, 800); // Reduced from 1500ms to 800ms
      
      return () => clearTimeout(timer);
    }
  }, [faulted]);

  if (!memoizedLocationData) {
    return (
      <div className="p-4 text-center">
        <Loader className="mx-auto mb-2 h-6 w-6 animate-spin" />
        <p className="text-sm">{t("Loading location data...", "正在加载位置数据...")}</p>
      </div>
    );
  }

  if (faulted && showFaultedMessage) {
    return (
      <div className="p-4 text-center">
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
      className={`transition-all duration-200 ${contentVisible ? 'opacity-100' : 'opacity-0'}`} 
      ref={(node) => {
        containerRef.current = node;
        contentRef.current = node;
      }}
      data-location-id={locationData?.id}
      data-content-mounted={contentMounted ? "true" : "false"}
    >
      <StatusMessage 
        message={statusMessage} 
        onClear={() => setStatusMessage(null)} 
        autoHideDuration={2000} // Reduced from 3000ms to 2000ms
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
        <LocationContentLoader loadingText={t("Preparing data...", "正在准备数据...")} />
      ) : (
        <div className="content-container" style={{ minHeight: '300px' }}>
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
        </div>
      )}
    </div>
  );
});

LocationDetailsContent.displayName = 'LocationDetailsContent';

export default LocationDetailsContent;
