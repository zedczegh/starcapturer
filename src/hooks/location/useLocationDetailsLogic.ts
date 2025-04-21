
import { useEffect, useRef, useState } from "react";
import { useLocationDataManager } from "@/hooks/location/useLocationDataManager";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentPosition } from "@/utils/geolocationUtils";
import { getLocationInfo } from "@/data/locationDatabase";
import { isInChina } from "@/utils/chinaBortleData"; // Import isInChina from the correct location
import { prefetchLocationData } from "@/lib/queryPrefetcher"; // Import prefetchLocationData

export function useLocationDetailsLogic({ id, location, navigate, t, setCachedData, getCachedData }) {
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const locationInitializedRef = useRef(false);
  const initialRenderRef = useRef(true);
  const siqsUpdateRequiredRef = useRef(true);
  
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

  // Use the SIQS updater to keep scores in sync with forecast data
  const { resetUpdateState } = useLocationSIQSUpdater(
    locationData,
    locationData?.forecastData,
    setLocationData,
    t
  );

  // Handle using current location when no location data is available
  useEffect(() => {
    // Only proceed if we're not loading, don't have location data, not already getting location,
    // and haven't already initialized location
    if (!isLoading && !locationData && !loadingCurrentLocation && !locationInitializedRef.current) {
      locationInitializedRef.current = true; // Mark as initialized to prevent multiple calls
      handleUseCurrentLocation();
    }
  }, [isLoading, locationData]);

  const handleUseCurrentLocation = () => {
    if (loadingCurrentLocation) return; // Prevent multiple simultaneous calls
    
    setLoadingCurrentLocation(true);
    t("Getting your current location...", "正在获取您的位置...");
    
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
        t("Could not get your location. Please check browser permissions.", 
                     "无法获取您的位置。请检查浏览器权限。");
        setLoadingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Run once on initial render to trigger page refresh
  useEffect(() => {
    if (initialRenderRef.current && locationData) {
      initialRenderRef.current = false;
      console.log("Initial render, triggering forced refresh");
      
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        try {
          // Reset SIQS update state to force recalculation
          resetUpdateState();
          siqsUpdateRequiredRef.current = true;
          
          // Trigger a refresh event on the viewport
          const viewport = document.querySelector('[data-refresh-trigger]');
          if (viewport) {
            viewport.dispatchEvent(new CustomEvent('forceRefresh'));
            console.log("Force refresh event dispatched");
          }
        } catch (error) {
          console.error("Error triggering refresh:", error);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [locationData, resetUpdateState]);

  // Prefetch data when location data is available to improve loading speed
  const queryClient = useQueryClient();
  useEffect(() => {
    if (locationData && !isLoading && locationData.latitude && locationData.longitude) {
      prefetchLocationData(queryClient, locationData.latitude, locationData.longitude);
      
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
  }, [locationData, isLoading, queryClient, resetUpdateState]);

  // Make sure we have Bortle scale data, with special handling for Chinese locations
  const { updateBortleScale } = useBortleUpdater();
  useEffect(() => {
    const updateBortleScaleData = async () => {
      if (!locationData || isLoading) return;
      
      // Check if we're in any Chinese region to update Bortle data
      const inChina = locationData.latitude && locationData.longitude ? 
        isInChina(locationData.latitude, locationData.longitude) : false;
      
      // For Chinese locations, or if Bortle scale is missing, update it
      if (inChina || locationData.bortleScale === null || locationData.bortleScale === undefined) {
        try {
          console.log("Location may be in China or needs Bortle update:", locationData.name);
          
          // Use our improved Bortle updater for more accurate data
          const newBortleScale = await updateBortleScale(
            locationData.latitude,
            locationData.longitude,
            locationData.name,
            locationData.bortleScale
          );
          
          if (newBortleScale !== null && newBortleScale !== locationData.bortleScale) {
            console.log(`Bortle scale updated: ${locationData.bortleScale} -> ${newBortleScale}`);
            setLocationData({
              ...locationData,
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
    if (
      locationData &&
      (locationData.name === t("Current Location", "当前位置") || !locationData.name) &&
      typeof locationData.latitude === "number" &&
      typeof locationData.longitude === "number"
    ) {
      // Get internal DB estimate for the coordinates, prefer user language
      const locationInfo = getLocationInfo(locationData.latitude, locationData.longitude);
      if (locationInfo && locationInfo.name) {
        setLocationData({
          ...locationData,
          name: locationInfo.formattedName,
          bortleScale: locationInfo.bortleScale
        });
      }
    }
  }, [locationData, t, setLocationData]);

  return {
    locationData,
    setLocationData,
    statusMessage,
    messageType,
    setStatusMessage,
    handleUpdateLocation,
    isLoading,
    loadingCurrentLocation,
    setLoadingCurrentLocation
  };
}
