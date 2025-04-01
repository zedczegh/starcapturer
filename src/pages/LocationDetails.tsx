
import React, { Suspense, lazy, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLocationDataManager } from "@/hooks/location/useLocationDataManager";
import PageLoader from "@/components/loaders/PageLoader";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useLocationNameTranslation } from "@/hooks/location/useLocationNameTranslation";
import { prefetchLocationData } from "@/lib/queryPrefetcher";
import { useQueryClient } from "@tanstack/react-query";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { isInChina } from "@/utils/chinaBortleData";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

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
  
  // Determine if we're coming from photo points - check both URL and state flag
  const isPhotoPoint = location.pathname.includes("/photo-point/") || 
                       (location.state?.location?.fromPhotoPoints === true);
  
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

  // Handle back navigation to ensure clean return to home page
  useEffect(() => {
    const handleBackNavigation = () => {
      // If we came from photo points, go back to photo-points page
      if (isPhotoPoint || (locationData && locationData.fromPhotoPoints)) {
        navigate("/photo-points", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    window.addEventListener('popstate', handleBackNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleBackNavigation);
    };
  }, [navigate, locationData, isPhotoPoint]);

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
  
  // Ensure SIQS is updated when coming from calculator or photo points
  useEffect(() => {
    if ((locationData?.fromCalculator || locationData?.fromPhotoPoints) && siqsUpdateRequiredRef.current) {
      console.log("Location from calculator or photo points, ensuring SIQS data is preserved");
      resetUpdateState();
      siqsUpdateRequiredRef.current = false;
    }
  }, [locationData, resetUpdateState]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!locationData) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LocationError />
      </Suspense>
    );
  }

  return (
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
  );
};

export default LocationDetails;
