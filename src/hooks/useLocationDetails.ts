import { useState, useCallback, useRef, useEffect } from "react";
import { useForecastManager } from "./locationDetails/useForecastManager";
import { useWeatherUpdater } from "./useWeatherUpdater";
import { clearForecastCache } from "./siqs/forecastFetcher";
import { useWeatherSynchronizer } from "./locationDetails/useWeatherSynchronizer";
import { useSIQSUpdater } from "./locationDetails/useSIQSUpdater";

export const useLocationDetails = (locationData: any, setLocationData: (data: any) => void) => {
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const initialLoadCompleteRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const dataSyncTimerRef = useRef<number | null>(null);
  const preserveDetailedNameRef = useRef<boolean>(true); // New ref to preserve detailed names
  
  const { syncWeatherWithForecast } = useWeatherSynchronizer();
  const { updateSIQSWithForecast, resetUpdateState } = useSIQSUpdater();
  
  const { 
    forecastData, 
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    setForecastData,
    handleRefreshForecast: refreshForecast,
    handleRefreshLongRangeForecast: refreshLongRange,
    weatherAlerts
  } = useForecastManager(locationData);
  
  const {
    loading: weatherLoading,
    setLoading,
    handleRefreshAll: refreshWeather,
    updateLightPollutionData
  } = useWeatherUpdater();

  // Check if location has changed to reset cache and trigger a fresh update
  useEffect(() => {
    if (!locationData) return;
    
    const currentLocation = `${locationData.latitude?.toFixed(4)}-${locationData.longitude?.toFixed(4)}`;
    
    if (lastLocationRef.current && lastLocationRef.current !== currentLocation) {
      console.log("Location changed, clearing forecast cache");
      clearForecastCache(); // Clear cache when location changes
      initialLoadCompleteRef.current = false; // Reset to trigger a refresh
      resetUpdateState(); // Reset SIQS update flag
      preserveDetailedNameRef.current = true; // Reset name preservation flag
      
      // Clear any existing sync timer
      if (dataSyncTimerRef.current) {
        window.clearTimeout(dataSyncTimerRef.current);
        dataSyncTimerRef.current = null;
      }
    }
    
    lastLocationRef.current = currentLocation;
  }, [locationData?.latitude, locationData?.longitude, resetUpdateState]);

  // Auto-refresh data on initial mount
  useEffect(() => {
    // Only run once and only if we have locationData
    if (!initialLoadCompleteRef.current && locationData && 
        locationData.latitude && locationData.longitude) {
      
      // Set a slight delay to ensure all components are mounted
      const timer = setTimeout(() => {
        console.log("Auto-refreshing on initial load");
        handleRefreshAll();
        initialLoadCompleteRef.current = true;
      }, 300); // Reduced delay for faster response
      
      return () => clearTimeout(timer);
    }
  }, [locationData]);

  // Update SIQS score when forecast data is available and ensure data consistency
  useEffect(() => {
    if (forecastData && !forecastLoading && locationData) {
      // Preserve the detailed location name before sync
      const detailedName = locationData.formattedName;
      const isDetailedName = detailedName && 
                            !detailedName.includes('°') && 
                            !detailedName.includes('Location at') &&
                            !detailedName.includes('Remote area') &&
                            detailedName.length > 5;
      
      // Sync weather data with forecast data while preserving detailed name
      syncWeatherWithForecast(forecastData, locationData, (updatedData) => {
        // Preserve detailed location name if we have one and if we're still in preservation mode
        if (preserveDetailedNameRef.current && isDetailedName) {
          updatedData.formattedName = detailedName;
          
          // After the first few seconds, we can allow name updates
          // This ensures initial detailed name is preserved but allows future updates
          if (!dataSyncTimerRef.current) {
            dataSyncTimerRef.current = window.setTimeout(() => {
              preserveDetailedNameRef.current = false;
              console.log("Detailed name preservation period ended");
              dataSyncTimerRef.current = null;
            }, 10000); // Preserve detailed name for 10 seconds
          }
        }
        
        setLocationData(updatedData);
      });
      
      // Update SIQS using forecast data
      updateSIQSWithForecast(locationData, forecastData, forecastLoading, setLocationData);
    }
  }, [forecastData, forecastLoading, locationData, setLocationData, syncWeatherWithForecast, updateSIQSWithForecast]);

  // Memoized wrapper functions
  const handleRefreshForecast = useCallback((latitude: number, longitude: number) => {
    if (!locationData) return;
    
    // Reset SIQS update flag to ensure it updates again
    resetUpdateState();
    
    // Clear the cache for this specific location to force a fresh fetch
    clearForecastCache(locationData.latitude, locationData.longitude);
    refreshForecast(locationData.latitude, locationData.longitude);
  }, [locationData, refreshForecast, resetUpdateState]);

  const handleRefreshLongRangeForecast = useCallback((latitude: number, longitude: number) => {
    if (!locationData) return;
    refreshLongRange(locationData.latitude, locationData.longitude);
  }, [locationData, refreshLongRange]);
  
  // Wrapper function for refreshing all data
  const handleRefreshAll = useCallback(async () => {
    if (!locationData) return;
    
    resetUpdateState();
    
    const fetchAllData = async () => {
      const results = await Promise.allSettled([
        handleRefreshForecast(locationData.latitude, locationData.longitude),
        handleRefreshLongRangeForecast(locationData.latitude, locationData.longitude),
        refreshWeather(locationData, setLocationData, () => {}, setStatusMessage)
      ]);
      
      console.log("Refresh results:", results.map(r => r.status));
    };

    fetchAllData();
  }, [locationData, setLocationData, handleRefreshForecast, handleRefreshLongRangeForecast, refreshWeather, resetUpdateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dataSyncTimerRef.current) {
        window.clearTimeout(dataSyncTimerRef.current);
      }
    };
  }, []);

  return {
    forecastData,
    longRangeForecast,
    loading: weatherLoading, // Use weatherLoading as the overall loading state
    forecastLoading,
    longRangeLoading,
    gettingUserLocation,
    statusMessage,
    setStatusMessage,
    setGettingUserLocation,
    handleRefreshAll,
    handleRefreshForecast,
    handleRefreshLongRangeForecast,
    setLoading,
    setForecastData,
    weatherAlerts
  };
};
