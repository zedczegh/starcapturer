
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
  
  // For homepage (no ID), we'll use a default location or user's saved location
  const isHomepage = !id;
  
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
    defaultLocation: isHomepage
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

  // Handle back navigation to ensure clean return
  useEffect(() => {
    if (!isHomepage) {
      const handleBackNavigation = () => {
        navigate("/", { replace: true });
      };

      window.addEventListener('popstate', handleBackNavigation);
      
      return () => {
        window.removeEventListener('popstate', handleBackNavigation);
      };
    }
  }, [navigate, isHomepage]);

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

  // For homepage with no location data, show a welcome screen that guides users
  if (!locationData && isHomepage) {
    return (
      <>
        <NavBar />
        <Suspense fallback={<PageLoader />}>
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="text-center space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold text-primary">
                {t("Welcome to SIQS Sky Viewer", "欢迎使用SIQS天空查看器")}
              </h1>
              <p className="text-lg">
                {t("Your guide to perfect astrophotography conditions", "您的天文摄影条件完美指南")}
              </p>
              
              {/* Add a "Get Started" button that triggers geolocation */}
              <button 
                className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
                onClick={() => {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      navigate(`/location/current?lat=${latitude}&lng=${longitude}`);
                    },
                    (error) => {
                      console.error("Geolocation error:", error);
                      setStatusMessage(t ? t("Could not get your location. Please try entering it manually.", "无法获取您的位置。请尝试手动输入。") : "Could not get your location");
                    }
                  );
                }}
              >
                {t("Get Started with Your Location", "使用您的位置开始")}
              </button>
            </div>
          </div>
        </Suspense>
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
          handleUpdateLocation={async (updatedData: any) => {
            // Wrap the handleUpdateLocation function to make it return void
            await handleUpdateLocation(updatedData);
          }}
        />
      </Suspense>
    </>
  );
};

export default LocationDetails;
