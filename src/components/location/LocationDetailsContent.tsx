
import React, { memo, lazy, Suspense, useEffect, useCallback, useRef } from "react";
import LocationHeader from "@/components/location/LocationHeader";
import StatusMessage from "@/components/location/StatusMessage";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateNighttimeSIQS } from "@/utils/nighttimeSIQS";

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

  // Calculate SIQS with focus on nighttime conditions
  const updateSIQSWithNighttimeData = useCallback(() => {
    // Only proceed if we have the necessary data
    if (locationData?.weatherData && forecastData?.hourly) {
      console.log("Using nighttime forecast data for SIQS calculation");
      
      // Calculate fresh SIQS using the utility function
      const freshSIQSResult = calculateNighttimeSIQS(locationData, forecastData, t);
      
      if (freshSIQSResult) {
        console.log("SIQS analysis based on nighttime conditions:", freshSIQSResult.score);
        
        // Update the SIQS result when forecast data changes
        setLocationData({
          ...locationData,
          siqsResult: freshSIQSResult
        });
      }
    }
  }, [forecastData, locationData, setLocationData, t]);

  // Listen for parent component requesting a refresh
  useEffect(() => {
    const handleForceRefresh = () => {
      console.log("Force refresh request received from parent");
      handleRefreshAll();
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
  }, [handleRefreshAll]);

  // Calculate SIQS immediately when forecast data changes
  useEffect(() => {
    if (forecastData && forecastData.hourly) {
      updateSIQSWithNighttimeData();
    }
  }, [forecastData, updateSIQSWithNighttimeData]);
  
  // Enhanced auto-refresh when page is opened or location is updated
  useEffect(() => {
    // Check if we came from PhotoPoints or another source
    const fromPhotoPoints = locationData?.fromPhotoPoints === true;
    
    // Create a location signature to detect changes
    const locationSignature = `${locationData?.latitude}-${locationData?.longitude}`;
    
    // If location has changed or coming from PhotoPoints, refresh data
    if (locationSignature !== lastLocationRef.current || 
        fromPhotoPoints || 
        !autoRefreshAttemptedRef.current) {
      
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
        
        // Reset the fromPhotoPoints flag after refreshing
        if (fromPhotoPoints && locationData) {
          setLocationData({
            ...locationData,
            fromPhotoPoints: false
          });
        }
      }, 300); // Reduced from 500ms for faster refresh
    }
    
    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [locationData, handleRefreshAll, setLocationData]);

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
