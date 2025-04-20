
import React, { memo, lazy, Suspense, useEffect, useCallback, useRef } from "react";
import StatusMessage from "@/components/location/StatusMessage";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";

// Lazy load the content grid for better performance
const LocationContentGrid = lazy(() => import("@/components/location/LocationContentGrid"));

interface LocationDetailsContentProps {
  locationData: any;
  setLocationData: (data: any) => void;
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
}

const LocationDetailsContent = memo<LocationDetailsContentProps>(({
  locationData,
  setLocationData,
  onLocationUpdate
}) => {
  const { t } = useLanguage();
  const lastLocationRef = useRef<string>('');
  const refreshTimerRef = useRef<number | null>(null);
  const autoRefreshAttemptedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Check if this is a redirect with data that doesn't need refresh
  const isRedirect = locationData?.fromPhotoPoints || locationData?.fromCalculator;
  const hasRequiredData = Boolean(locationData?.weatherData && locationData?.siqsResult);
  
  const {
    forecastData,
    longRangeForecast,
    loading,
    forecastLoading,
    longRangeLoading,
    gettingUserLocation,
    statusMessage,
    setStatusMessage,
    setGettingUserLocation,
    handleRefreshAll,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  } = useLocationDetails(locationData, setLocationData);

  // Update SIQS when forecast data changes
  const { resetUpdateState } = useLocationSIQSUpdater(
    locationData, 
    forecastData, 
    setLocationData,
    t
  );

  // Listen for parent component requesting a refresh
  useEffect(() => {
    const handleForceRefresh = () => {
      console.log("Force refresh request received from parent");
      handleRefreshAll();
      resetUpdateState(); // Reset SIQS updater state on manual refresh
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('forceRefresh', handleForceRefresh);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('forceRefresh', handleForceRefresh);
      }
    };
  }, [handleRefreshAll, resetUpdateState]);
  
  // Enhanced auto-refresh when page is opened or location is updated
  useEffect(() => {
    // Skip auto-refresh if we're coming from a redirect with existing data
    if (isRedirect && hasRequiredData) {
      console.log("Skipping content refresh due to redirect with existing data");
      autoRefreshAttemptedRef.current = true;
      
      // Clear any existing flag after redirect
      if (locationData) {
        const { fromPhotoPoints, fromCalculator, ...rest } = locationData;
        if (fromPhotoPoints || fromCalculator) {
          // Update the locationData to remove the flags but don't trigger a full refresh
          setLocationData({
            ...rest
          });
        }
      }
      
      return;
    }
    
    // Create a location signature to detect changes
    const locationSignature = `${locationData?.latitude}-${locationData?.longitude}`;
    
    // If location has changed or we haven't refreshed yet, refresh data
    if (locationSignature !== lastLocationRef.current || !autoRefreshAttemptedRef.current) {
      lastLocationRef.current = locationSignature;
      autoRefreshAttemptedRef.current = true;
      
      // Clear any existing timer
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      
      // Set a small delay before refreshing to allow component to fully mount
      refreshTimerRef.current = window.setTimeout(() => {
        console.log("Auto-refreshing data after location update or page load");
        handleRefreshAll();
        resetUpdateState(); // Reset SIQS updater state
      }, 300); // Reduced from 500ms for faster refresh
    }
    
    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [locationData, handleRefreshAll, setLocationData, resetUpdateState, isRedirect, hasRequiredData]);

  return (
    <div className="transition-all duration-300 animate-fade-in" ref={containerRef}> 
      <StatusMessage 
        message={statusMessage} 
        onClear={() => setStatusMessage(null)} 
      />
      
      <Suspense fallback={
        <div className="animate-pulse h-96 rounded-lg bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">{t("Loading content...", "正在加载内容...")}</p>
          </div>
        </div>
      }>
        <LocationContentGrid 
          locationData={locationData}
          forecastData={forecastData}
          longRangeForecast={longRangeForecast}
          forecastLoading={forecastLoading}
          longRangeLoading={longRangeLoading}
          gettingUserLocation={gettingUserLocation}
          onLocationUpdate={onLocationUpdate}
          setGettingUserLocation={setGettingUserLocation}
          setStatusMessage={setStatusMessage}
          onRefreshForecast={handleRefreshForecast}
          onRefreshLongRange={handleRefreshLongRangeForecast}
        />
      </Suspense>
    </div>
  );
});

LocationDetailsContent.displayName = 'LocationDetailsContent';

export default LocationDetailsContent;
