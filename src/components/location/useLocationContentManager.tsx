
import { useRef, useEffect, useState, useMemo } from "react";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import { useWeatherAutoRefresh } from "@/hooks/location/useWeatherAutoRefresh";
import { useLanguage } from "@/contexts/LanguageContext";

export function useLocationContentManager(
  locationData: any,
  setLocationData: (data: any) => void,
  onLocationUpdate: (loc: { name: string; latitude: number; longitude: number }) => Promise<void>
) {
  const { t } = useLanguage();
  const lastLocationRef = useRef<string>('');
  const refreshTimerRef = useRef<number | null>(null);
  const autoRefreshAttemptedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [faulted, setFaulted] = useState(false);
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

  // Mount loader
  useEffect(() => {
    const timer = setTimeout(() => setContentLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Event-driven force refresh
  useEffect(() => {
    const handleForceRefresh = () => {
      try {
        handleRefreshAll();
        resetUpdateState();
      } catch (error) {
        setRetryCount(prev => prev + 1);
        if (retryCount >= 3 && locationData?.latitude && locationData?.longitude) {
          setTimeout(() => {
            try {
              handleRefreshForecast(locationData.latitude, locationData.longitude);
            } catch {}
            try {
              handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude);
            } catch {}
          }, 1000);
        }
      }
    };

    const container = containerRef.current;
    if (container) container.addEventListener('forceRefresh', handleForceRefresh);

    return () => {
      if (container) container.removeEventListener('forceRefresh', handleForceRefresh);
    };
  }, [
    handleRefreshAll, resetUpdateState, handleRefreshForecast, handleRefreshLongRangeForecast,
    retryCount, locationData
  ]);

  // Weather auto-refresh
  useWeatherAutoRefresh({
    weatherData: locationData?.weatherData,
    refreshFn: handleRefreshAll,
    maxRetries: 3,
    retryDelay: 2500
  });

  // Auto refresh on location change or missing data
  useEffect(() => {
    const locationSignature = locationData ? `${locationData.latitude}-${locationData.longitude}` : 'none';
    if (
      (locationSignature !== lastLocationRef.current || !autoRefreshAttemptedRef.current)
      && locationData
    ) {
      lastLocationRef.current = locationSignature;
      autoRefreshAttemptedRef.current = true;

      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);

      refreshTimerRef.current = window.setTimeout(() => {
        try {
          handleRefreshAll();
          resetUpdateState();
        } catch {}
      }, 500);
    }

    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [locationData, handleRefreshAll, setLocationData, resetUpdateState, isRedirect, hasRequiredData]);

  const memoizedLocationData = useMemo(() => locationData, [
    locationData?.latitude,
    locationData?.longitude,
    locationData?.name,
    locationData?.timestamp
  ]);

  return {
    lastLocationRef,
    containerRef,
    contentLoaded,
    setContentLoaded,
    faulted,
    setFaulted,
    retryCount,
    setRetryCount,
    isRedirect,
    hasRequiredData,
    memoizedLocationData,
    forecastData,
    longRangeForecast,
    loading,
    forecastLoading,
    longRangeLoading,
    gettingUserLocation,
    statusMessage,
    setStatusMessage,
    setGettingUserLocation,
    handleRefreshForecast,
    handleRefreshLongRangeForecast,
    onLocationUpdate,
    resetUpdateState
  };
}
