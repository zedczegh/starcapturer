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
  const loadingMessageTimeoutRef = useRef(null);
  const dataLoadStartTime = useRef(Date.now());
  
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
      
      // Clear loading message if it's about getting location - more aggressively
      if (statusMessage?.includes("Getting your current location") || 
          statusMessage?.includes("正在获取您的位置")) {
        // Use a shorter delay and make sure it clears
        if (loadingMessageTimeoutRef.current) {
          clearTimeout(loadingMessageTimeoutRef.current);
        }
        
        // Calculate how long the message has been shown already
        const timeElapsed = Date.now() - dataLoadStartTime.current;
        const clearDelay = timeElapsed > 800 ? 50 : 250; // Very short delay if it's been showing a while
        
        loadingMessageTimeoutRef.current = setTimeout(() => {
          setStatusMessage(null);
          setLoadingCurrentLocation(false);
        }, clearDelay);
      }
    }
  }, [locationData, isLoading, statusMessage, setStatusMessage]);

  // Clean up timeouts and prevent memory leaks
  useEffect(() => {
    return () => {
      if (loadingMessageTimeoutRef.current) {
        clearTimeout(loadingMessageTimeoutRef.current);
        loadingMessageTimeoutRef.current = null;
      }
      // Clear any pending SIQS updates to prevent memory leaks
      siqsUpdateRequiredRef.current = false;
    };
  }, []);

  // Use the SIQS updater to keep scores in sync with forecast data
  const { resetUpdateState } = useLocationSIQSUpdater(
    locationData || previousLocationDataRef.current,
    locationData?.forecastData || (previousLocationDataRef.current?.forecastData),
    setLocationData,
    t
  );

  // Pre-fetch data as soon as we have location coordinates - with parallel loading
  useEffect(() => {
    const locData = locationData || previousLocationDataRef.current;
    if (
      locData?.latitude && 
      locData?.longitude && 
      !queriesInitializedRef.current
    ) {
      queriesInitializedRef.current = true;
      
      // Immediate prefetch for faster loading - don't wait for next tick
      prefetchLocationData(queryClient, locData.latitude, locData.longitude);
      
      console.log("Prefetching data for location:", locData.name);
    }
  }, [locationData?.latitude, locationData?.longitude, queryClient]);

  // Ensure we have a fallback SIQS score based on Bortle scale for current location
  useEffect(() => {
    if (locationData && 
        (!locationData.siqsResult || typeof locationData.siqsResult?.score !== 'number') &&
        typeof locationData.bortleScale === 'number') {
      
      // Use a more robust formula that works well with all Bortle scales
      const estimatedScore = Math.max(0.1, 10 - locationData.bortleScale * 0.8);
      
      console.log(`Generated default SIQS score of ${estimatedScore.toFixed(1)} based on Bortle scale ${locationData.bortleScale}`);
      
      setLocationData({
        ...locationData,
        siqsResult: {
          score: estimatedScore,
          isViable: estimatedScore >= 5
        }
      });
    }
  }, [locationData, setLocationData]);

  // Handle using current location when no location data is available
  useEffect(() => {
    // Only proceed if we're not loading, don't have location data, not already getting location,
    // and haven't already initialized location
    const shouldGetCurrentLocation = !isLoading && !locationData && !loadingCurrentLocation && !locationInitializedRef.current && !previousLocationDataRef.current;
    
    console.log("LocationDetailsLogic: Location check", {
      isLoading,
      hasLocationData: !!locationData,
      loadingCurrentLocation,
      alreadyInitialized: locationInitializedRef.current,
      hasPreviousData: !!previousLocationDataRef.current,
      shouldGetCurrentLocation
    });
    
    if (shouldGetCurrentLocation) {
      locationInitializedRef.current = true; // Mark as initialized to prevent multiple calls
      console.log("LocationDetailsLogic: Getting current location...");
      handleUseCurrentLocation();
    }
  }, [isLoading, locationData, loadingCurrentLocation]);

  const handleUseCurrentLocation = () => {
    if (loadingCurrentLocation) return; // Prevent multiple simultaneous calls
    
    dataLoadStartTime.current = Date.now(); // Record when we started loading
    setLoadingCurrentLocation(true);
    setStatusMessage(t("Getting your current location...", "正在获取您的位置..."));
    
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Use our project location database to get the best estimate for this point
        const locationInfo = getLocationInfo(latitude, longitude);

        // Generate an accurate name and bortleScale directly from our DB
        const locationId = `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
        
        // Ensure we have a default SIQS score based on Bortle scale
        const bortleScale = locationInfo.bortleScale || 5;
        const defaultSiqsScore = 10 - bortleScale * 0.8;
        
        const locationData = {
          id: locationId,
          name: locationInfo.formattedName || t("Current Location", "当前位置"),
          latitude,
          longitude,
          bortleScale,
          timestamp: new Date().toISOString(),
          // Add default SIQS score based on Bortle scale for immediate display
          siqsResult: {
            score: defaultSiqsScore, 
            isViable: defaultSiqsScore >= 5
          }
        };

        navigate(`/location/${locationId}`, { 
          state: locationData,
          replace: true 
        });
        
        // Don't clear loading state here - we'll do it when location data is set
      },
      (error) => {
        console.error("Error getting location:", error);
        setStatusMessage(t("Could not get your location. Please check browser permissions.", 
                     "无法获取您的位置。请检查浏览器权限。"));
        setLoadingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
    );
  };

  // Run once on initial render to trigger page refresh - Optimized
  useEffect(() => {
    if (initialRenderRef.current && locationData) {
      initialRenderRef.current = false;
      console.log("Initial render, triggering lazy data loading");
      
      // Immediate action for faster response
      resetUpdateState();
      siqsUpdateRequiredRef.current = true;
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
