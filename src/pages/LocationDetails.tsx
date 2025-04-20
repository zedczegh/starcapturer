import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
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
import { getCurrentPosition } from "@/utils/geolocationUtils";
import { toast } from "sonner";

const LocationError = lazy(() => import("@/components/location/LocationError"));
const LocationDetailsViewport = lazy(() => import("@/components/location/LocationDetailsViewport"));

const preloadComponents = () => {
  import("@/components/location/LocationDetailsViewport");
  import("@/components/location/LocationContentGrid");
  import("@/components/SIQSSummary");
  import("@/components/WeatherConditions");
};

preloadComponents();

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
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const locationInitializedRef = useRef(false);
  const dataFetchedRef = useRef(false);

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

  const { resetUpdateState } = useLocationSIQSUpdater(
    locationData,
    locationData?.forecastData,
    setLocationData,
    t
  );

  useEffect(() => {
    if (locationData && !isLoading && locationData.latitude && locationData.longitude && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      
      setTimeout(() => {
        prefetchLocationData(queryClient, locationData.latitude, locationData.longitude);
      }, 100);
    }
  }, [locationData, isLoading, queryClient]);

  useEffect(() => {
    if (!isLoading && !locationData && !loadingCurrentLocation && !locationInitializedRef.current) {
      locationInitializedRef.current = true;
      handleUseCurrentLocation();
    }
  }, [isLoading, locationData]);

  const handleUseCurrentLocation = () => {
    if (loadingCurrentLocation) return;
    
    setLoadingCurrentLocation(true);
    toast.success(t("Getting your current location...", "正在获取您的位置..."), {
      id: "getting-location"
    });
    
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        const locationId = `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
        
        const locationData = {
          id: locationId,
          name: t("Current Location", "当前位置"),
          latitude,
          longitude,
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
        toast.error(t("Could not get your location. Please check browser permissions.", 
                     "无法获取您的位置。请检查浏览器权限。"));
        setLoadingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (initialRenderRef.current && locationData) {
      initialRenderRef.current = false;
      console.log("Initial render, triggering forced refresh");
      
      const timer = setTimeout(() => {
        try {
          resetUpdateState();
          siqsUpdateRequiredRef.current = true;
          
          const viewport = document.querySelector('[data-refresh-trigger]');
          if (viewport) {
            viewport.dispatchEvent(new CustomEvent('forceRefresh'));
          }
        } catch (error) {
          console.error("Error triggering refresh:", error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [locationData, resetUpdateState]);

  useLocationNameTranslation({
    locationData,
    setLocationData,
    setCachedData,
    getCachedData
  });

  useEffect(() => {
    if (!locationData || isLoading) return;
    
    const inChina = locationData.latitude && locationData.longitude ? 
      isInChina(locationData.latitude, locationData.longitude) : false;
    
    if (inChina || locationData.bortleScale === null || locationData.bortleScale === undefined) {
      try {
        console.log("Location may be in China or needs Bortle update:", locationData.name);
        
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
          
          resetUpdateState();
        }
      } catch (error) {
        console.error("Failed to update Bortle scale:", error);
      }
    }
  }, [locationData, isLoading, setLocationData, updateBortleScale, resetUpdateState]);

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
          <LocationError 
            onUseCurrentLocation={handleUseCurrentLocation} 
            isLoading={loadingCurrentLocation}
            autoLocate={true}
          />
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
