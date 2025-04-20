
import React, { memo, useEffect, useRef, useState } from "react";
import StatusMessage from "@/components/location/StatusMessage";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import { Loader } from "lucide-react";
import LocationContentGrid from "@/components/location/LocationContentGrid";

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
  const [contentLoaded, setContentLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
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
  
  // Mark content as loaded after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Listen for parent component requesting a refresh
  useEffect(() => {
    const handleForceRefresh = () => {
      console.log("Force refresh request received from parent");
      // Add error handling around refresh operations
      try {
        handleRefreshAll();
        resetUpdateState(); // Reset SIQS updater state on manual refresh
      } catch (error) {
        console.error("Error during force refresh:", error);
        // If refresh fails, increment retry counter
        setRetryCount(prev => prev + 1);
        
        // After 3 retries, try a different approach
        if (retryCount >= 3) {
          console.log("Multiple refresh attempts failed, trying alternative approach");
          setTimeout(() => {
            // Try individual refresh operations separately
            try { handleRefreshForecast(); } catch (e) { console.error("Forecast refresh failed:", e); }
            try { handleRefreshLongRangeForecast(); } catch (e) { console.error("Long range refresh failed:", e); }
          }, 1000);
        }
      }
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
  }, [handleRefreshAll, resetUpdateState, handleRefreshForecast, handleRefreshLongRangeForecast, retryCount]);
  
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
    const locationSignature = locationData ? `${locationData.latitude}-${locationData.longitude}` : 'none';
    
    // If location has changed or we haven't refreshed yet, refresh data
    if ((locationSignature !== lastLocationRef.current || !autoRefreshAttemptedRef.current) && locationData) {
      lastLocationRef.current = locationSignature;
      autoRefreshAttemptedRef.current = true;
      
      // Clear any existing timer
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      
      // Set a small delay before refreshing to allow component to fully mount
      refreshTimerRef.current = window.setTimeout(() => {
        try {
          console.log("Auto-refreshing data after location update or page load");
          handleRefreshAll();
          resetUpdateState(); // Reset SIQS updater state
        } catch (error) {
          console.error("Error during auto-refresh:", error);
        }
      }, 500);
    }
    
    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [locationData, handleRefreshAll, setLocationData, resetUpdateState, isRedirect, hasRequiredData]);

  // Safe render with error boundary pattern
  if (!locationData) {
    return (
      <div className="p-8 text-center">
        <Loader className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p>{t("Loading location data...", "正在加载位置数据...")}</p>
      </div>
    );
  }

  return (
    <div className="transition-all duration-300 animate-fade-in" ref={containerRef}> 
      <StatusMessage 
        message={statusMessage} 
        onClear={() => setStatusMessage(null)} 
      />
      
      {loading || !contentLoaded ? (
        <div className="animate-pulse h-96 rounded-lg bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">{t("Loading content...", "正在加载内容...")}</p>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
});

LocationDetailsContent.displayName = 'LocationDetailsContent';

export default LocationDetailsContent;
