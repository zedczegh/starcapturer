import React, { memo, useEffect, useRef, useState, useMemo, Suspense } from "react";
import StatusMessage from "@/components/location/StatusMessage";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import { useWeatherAutoRefresh } from "@/hooks/location/useWeatherAutoRefresh";

const LocationContentGrid = React.lazy(() => import("./LocationContentGrid"));

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

  const { resetUpdateState } = useLocationSIQSUpdater(
    locationData, 
    forecastData, 
    setLocationData,
    t
  );
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleForceRefresh = () => {
      console.log("Force refresh request received from parent");
      try {
        handleRefreshAll();
        resetUpdateState();
      } catch (error) {
        console.error("Error during force refresh:", error);
        setRetryCount(prev => prev + 1);
        if (retryCount >= 3) {
          console.log("Multiple refresh attempts failed, trying alternative approach");
          setTimeout(() => {
            try { 
              if (locationData?.latitude && locationData?.longitude) {
                handleRefreshForecast(locationData.latitude, locationData.longitude); 
              }
            } catch (e) { 
              console.error("Forecast refresh failed:", e); 
            }
            try { 
              if (locationData?.latitude && locationData?.longitude) {
                handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude); 
              }
            } catch (e) { 
              console.error("Long range refresh failed:", e); 
            }
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
  }, [handleRefreshAll, resetUpdateState, handleRefreshForecast, handleRefreshLongRangeForecast, retryCount, locationData]);
  
  useWeatherAutoRefresh({
    weatherData: locationData?.weatherData,
    refreshFn: handleRefreshAll,
    maxRetries: 3,
    retryDelay: 2500
  });

  useEffect(() => {
    const locationSignature = locationData ? `${locationData.latitude}-${locationData.longitude}` : 'none';
    
    if ((locationSignature !== lastLocationRef.current || !autoRefreshAttemptedRef.current) && locationData) {
      lastLocationRef.current = locationSignature;
      autoRefreshAttemptedRef.current = true;
      
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      
      refreshTimerRef.current = window.setTimeout(() => {
        try {
          handleRefreshAll();
          resetUpdateState();
        } catch (error) {
          console.error("Error during auto-refresh:", error);
        }
      }, 500);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [locationData, handleRefreshAll, setLocationData, resetUpdateState, isRedirect, hasRequiredData]);

  const memoizedLocationData = useMemo(() => locationData, [
    locationData?.latitude,
    locationData?.longitude,
    locationData?.name,
    locationData?.timestamp
  ]);

  if (!memoizedLocationData) {
    return (
      <div className="p-8 text-center">
        <Loader className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p>{t("Loading location data...", "正在加载位置数据...")}</p>
      </div>
    );
  }

  const handleRefreshForecastWithCoords = () => {
    if (locationData?.latitude && locationData?.longitude) {
      handleRefreshForecast(locationData.latitude, locationData.longitude);
    }
  };
  
  const handleRefreshLongRangeForecastWithCoords = () => {
    if (locationData?.latitude && locationData?.longitude) {
      handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
    }
  };

  return (
    <div className="transition-all duration-300 animate-fade-in" ref={containerRef}> 
      <StatusMessage 
        message={statusMessage} 
        onClear={() => setStatusMessage(null)} 
      />
      
      {loading || !contentLoaded ? (
        <div className="animate-pulse h-96 rounded-lg bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-muted-foreground">{t("Loading content...", "正在加载内容...")}</p>
          </div>
        </div>
      ) : (
        <Suspense fallback={
          <div className="animate-pulse h-96 rounded-lg bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20" />
        }>
          <LocationContentGrid 
            locationData={memoizedLocationData}
            forecastData={forecastData}
            longRangeForecast={longRangeForecast}
            forecastLoading={forecastLoading}
            longRangeLoading={longRangeLoading}
            gettingUserLocation={gettingUserLocation}
            onLocationUpdate={onLocationUpdate}
            setGettingUserLocation={setGettingUserLocation}
            setStatusMessage={setStatusMessage}
            onRefreshForecast={handleRefreshForecastWithCoords}
            onRefreshLongRange={handleRefreshLongRangeForecastWithCoords}
          />
        </Suspense>
      )}
    </div>
  );
});

LocationDetailsContent.displayName = 'LocationDetailsContent';

export default LocationDetailsContent;
