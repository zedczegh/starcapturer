import React, { Suspense, lazy, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLocationDataManager } from "@/hooks/location/useLocationDataManager";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useLocationNameTranslation } from "@/hooks/location/useLocationNameTranslation";
import { prefetchLocationData } from "@/lib/queryPrefetcher";
import { useQueryClient } from "@tanstack/react-query";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { isInChina } from "@/utils/chinaBortleData";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import { useLanguage } from "@/contexts/LanguageContext";
import PageLoader from "@/components/loaders/PageLoader";
import NavBar from "@/components/NavBar";

// Lazy-loaded components for better performance
const LocationError = lazy(() => import("@/components/location/LocationError"));
const LocationDetailsViewport = lazy(() => import("@/components/location/LocationDetailsViewport"));

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCachedData, getCachedData } = useLocationDataCache();
  const { updateBortleScale } = useBortleUpdater();
  const { t } = useLanguage();
  const siqsUpdateRequiredRef = useRef(true);
  const initialRenderRef = useRef(true);
  
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
    navigate 
  });

  // Use the SIQS updater to keep scores in sync with forecast data
  const { resetUpdateState } = useLocationSIQSUpdater(
    locationData,
    locationData?.forecastData,
    setLocationData,
    t
  );

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

  // Handle back navigation to ensure clean return to home page
  useEffect(() => {
    const handleBackNavigation = () => {
      navigate("/", { replace: true });
    };

    window.addEventListener('popstate', handleBackNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleBackNavigation);
    };
  }, [navigate]);

  // Use the extracted hook for location name translation
  useLocationNameTranslation({
    locationData,
    setLocationData,
    setCachedData,
    getCachedData
  });

  // Prefetch data when location data is available to improve loading speed
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

  if (isLoading) {
    return (
      <>
        <NavBar />
        <PageLoader />
      </>
    );
  }

  if (!locationData) {
    return (
      <>
        <NavBar />
        <Suspense fallback={<PageLoader />}>
          <LocationError />
        </Suspense>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Suspense fallback={<PageLoader />}>
        <LocationDetailsViewport 
          locationData={locationData}
          setLocationData={setLocationData}
          statusMessage={statusMessage}
          messageType={messageType}
          setStatusMessage={setStatusMessage}
          handleUpdateLocation={handleUpdateLocation}
        />
      </Suspense>
    </>
  );
};

export default LocationDetails;
