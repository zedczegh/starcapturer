
import React, { memo, lazy, Suspense, useEffect, useCallback, useRef } from "react";
import LocationHeader from "@/components/location/LocationHeader";
import StatusMessage from "@/components/location/StatusMessage";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import { useRefreshManager } from "@/hooks/location/useRefreshManager";
import { toast } from "sonner";

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
  const refreshAttemptedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  // Use the refresh manager to handle automatic refreshes
  const { shouldRefresh, markRefreshComplete, triggerManualRefresh } = useRefreshManager(locationData);

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
  
  // Handle automatic refresh when shouldRefresh changes to true
  useEffect(() => {
    if (shouldRefresh && locationData?.latitude && locationData?.longitude) {
      console.log("Performing refresh based on refresh manager signal");
      
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleRefreshAll();
        resetUpdateState();
        
        // Reset the fromPhotoPoints flag after refreshing
        if (locationData?.fromPhotoPoints) {
          setLocationData({
            ...locationData,
            fromPhotoPoints: false
          });
        }
        
        // Mark that refresh is complete
        markRefreshComplete();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [shouldRefresh, locationData, handleRefreshAll, setLocationData, resetUpdateState, markRefreshComplete]);

  return (
    <div className="transition-all duration-300 animate-fade-in" ref={containerRef}>
      <StatusMessage 
        message={statusMessage} 
        onClear={() => setStatusMessage(null)} 
      />
      
      <LocationHeader 
        name={locationData.name}
        latitude={locationData.latitude}
        longitude={locationData.longitude}
        timestamp={locationData.timestamp}
        loading={loading}
        onRefresh={handleRefreshAll}
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
