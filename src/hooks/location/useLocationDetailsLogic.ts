import { useEffect, useRef, useState } from "react";
import { useLocationDataManager } from "@/hooks/location/useLocationDataManager";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentPosition } from "@/utils/geolocationUtils";
import { getLocationInfo } from "@/data/locationDatabase";
import { isInChina } from "@/utils/chinaBortleData"; 
import { prefetchLocationData } from "@/lib/queryPrefetcher"; 

export function useLocationDetailsLogic({ id, location, navigate, t, setCachedData, getCachedData }) {
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [dataInitializing, setDataInitializing] = useState(true);
  const locationInitializedRef = useRef(false);
  const initialRenderRef = useRef(true);
  const siqsUpdateRequiredRef = useRef(true);
  const queriesInitializedRef = useRef(false);
  const previousLocationDataRef = useRef(null);
  const queryClient = useQueryClient();
  
  const {
    locationData, 
    setLocationData, 
    statusMessage, 
    messageType, 
    setStatusMessage,
    handleUpdateLocation,
    isLoading
  } = useLocationDataManager({ 
    id, 
    initialState: location.state, 
    navigate,
    noRedirect: true
  });

  // Store previous location data to prevent disappearing content
  useEffect(() => {
    if (locationData && !isLoading) {
      previousLocationDataRef.current = locationData;
      // Data is now initialized
      setDataInitializing(false);
    }
  }, [locationData, isLoading]);

  // Use the SIQS updater to keep scores in sync with forecast data
  const { resetUpdateState } = useLocationSIQSUpdater(
    locationData || previousLocationDataRef.current,
    locationData?.forecastData || (previousLocationDataRef.current?.forecastData),
    setLocationData,
    t
  );

  // Pre-fetch data as soon as we have location coordinates
  useEffect(() => {
    const locData = locationData || previousLocationDataRef.current;
    if (
      locData?.latitude && 
      locData?.longitude && 
      !queriesInitializedRef.current
    ) {
      queriesInitializedRef.current = true;
      
      // Use prefetcher to load data in parallel
      prefetchLocationData(queryClient, locData.latitude, locData.longitude);
      
      console.log("Prefetching data for location:", locData.name);
    }
  }, [locationData?.latitude, locationData?.longitude, queryClient]);

  // Handle using current location when no location data is available
  useEffect(() => {
    // Only proceed if we're not loading, don't have location data, not already getting location,
    // and haven't already initialized location
    if (!isLoading && !locationData && !loadingCurrentLocation && !locationInitializedRef.current && !previousLocationDataRef.current) {
      locationInitializedRef.current = true; // Mark as initialized to prevent multiple calls
      handleUseCurrentLocation();
    }
  }, [isLoading, locationData]);

  const handleUseCurrentLocation = () => {
    if (loadingCurrentLocation) return; // Prevent multiple simultaneous calls
    
    setLoadingCurrentLocation(true);
    setStatusMessage(t("Getting your current location...", "正在获取您的位置..."));
    
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Use our project location database to get the best estimate for this point
        const locationInfo = getLocationInfo(latitude, longitude);

        // Generate an accurate name and bortleScale directly from our DB
        const locationId = `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
        const locationData = {
          id: locationId,
          name: locationInfo.formattedName || t("Current Location", "当前位置"),
          latitude,
          longitude,
          bortleScale: locationInfo.bortleScale,
          timestamp: new Date().toISOString()
        };

        navigate(`/location/${locationId}`, { 
          state: locationData,
          replace: true 
        });
        
        setLoadingCurrentLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setStatusMessage(t("Could not get your location. Please check browser permissions.", 
                     "无法获取您的位置。请检查浏览器权限。"));
        setLoadingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Run once on initial render to trigger page refresh
  useEffect(() => {
    if (initialRenderRef.current && locationData) {
      initialRenderRef.current = false;
      console.log("Initial render, triggering lazy data loading");
      
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        try {
          // Reset SIQS update state to force recalculation
          resetUpdateState();
          siqsUpdateRequiredRef.current = true;
        } catch (error) {
          console.error("Error triggering refresh:", error);
        }
      }, 100); // Reduced delay for better performance
      
      return () => clearTimeout(timer);
    }
  }, [locationData, resetUpdateState]);

  // Prefetch data when location data is available to improve loading speed
  useEffect(() => {
    if (locationData && !isLoading && locationData.latitude && locationData.longitude) {
      // Reset the SIQS update state when location changes to force recalculation
      if (siqsUpdateRequiredRef.current) {
        resetUpdateState();
        siqsUpdateRequiredRef.current = false;
        
        // Set a timer to allow for SIQS updates after a certain period
        // This handles cases where forecast data might be delayed
        const timer = setTimeout(() => {
          siqsUpdateRequiredRef.current = true;
        }, 60000); // Allow updates every minute
        
        return () => clearTimeout(timer);
      }
    }
  }, [locationData, isLoading, resetUpdateState]);

  // Make sure we have Bortle scale data, with special handling for Chinese locations
  const { updateBortleScale } = useBortleUpdater();
  useEffect(() => {
    const updateBortleScaleData = async () => {
      const locData = locationData || previousLocationDataRef.current;
      if (!locData || isLoading) return;
      
      // Check if we're in any Chinese region to update Bortle data
      const inChina = locData.latitude && locData.longitude ? 
        isInChina(locData.latitude, locData.longitude) : false;
      
      // For Chinese locations, or if Bortle scale is missing, update it
      if (inChina || locData.bortleScale === null || locData.bortleScale === undefined) {
        try {
          console.log("Location may be in China or needs Bortle update:", locData.name);
          
          // Use our improved Bortle updater for more accurate data
          const newBortleScale = await updateBortleScale(
            locData.latitude,
            locData.longitude,
            locData.name,
            locData.bortleScale
          );
          
          if (newBortleScale !== null && newBortleScale !== locData.bortleScale) {
            console.log(`Bortle scale updated: ${locData.bortleScale} -> ${newBortleScale}`);
            setLocationData({
              ...locData,
              bortleScale: newBortleScale
            });
            
            // Force SIQS update after Bortle scale changes
            resetUpdateState();
          }
        } catch (error) {
          console.error("Failed to update Bortle scale:", error);
        }
      }
    };
    
    updateBortleScaleData();
  }, [locationData, isLoading, setLocationData, updateBortleScale, resetUpdateState]);
  
  // Ensure SIQS is updated when coming from calculator
  useEffect(() => {
    if (locationData?.fromCalculator && siqsUpdateRequiredRef.current) {
      console.log("Location from calculator, ensuring SIQS data is preserved");
      resetUpdateState();
      siqsUpdateRequiredRef.current = false;
    }
  }, [locationData, resetUpdateState]);

  // Whenever the page loads with only coordinates but no name, we replace with our best DB estimate:
  useEffect(() => {
    const locData = locationData || previousLocationDataRef.current;
    if (
      locData &&
      (locData.name === t("Current Location", "当前位置") || !locData.name) &&
      typeof locData.latitude === "number" &&
      typeof locData.longitude === "number"
    ) {
      // Get internal DB estimate for the coordinates, prefer user language
      const locationInfo = getLocationInfo(locData.latitude, locData.longitude);
      if (locationInfo && locationInfo.name) {
        setLocationData({
          ...locData,
          name: locationInfo.formattedName,
          bortleScale: locationInfo.bortleScale
        });
      }
    }
  }, [locationData, t, setLocationData]);

  return {
    locationData: locationData || previousLocationDataRef.current,
    setLocationData,
    statusMessage,
    messageType,
    setStatusMessage,
    handleUpdateLocation,
    isLoading: isLoading || dataInitializing,
    loadingCurrentLocation,
    setLoadingCurrentLocation
  };
}
