
import React, { Suspense, lazy, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLocationDataManager } from "@/hooks/location/useLocationDataManager";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useLocationNameTranslation } from "@/hooks/location/useLocationNameTranslation";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { useLocationSIQSUpdater } from "@/hooks/useLocationSIQSUpdater";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBortleScaleManager } from "@/hooks/location/useBortleScaleManager";
import { useLocationInitializer } from "@/hooks/location/useLocationInitializer";
import { useDataPrefetcher } from "@/hooks/location/useDataPrefetcher";
import PageLoader from "@/components/loaders/PageLoader";
import NavBar from "@/components/NavBar";

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
    navigate,
    noRedirect: true 
  });

  const { resetUpdateState } = useLocationSIQSUpdater(
    locationData,
    locationData?.forecastData,
    setLocationData,
    t
  );

  // Use our new hooks
  useDataPrefetcher(locationData, isLoading);
  
  const { loadingCurrentLocation, handleUseCurrentLocation } = useLocationInitializer(
    locationData,
    isLoading,
    navigate,
    t
  );

  useBortleScaleManager(
    locationData,
    isLoading,
    setLocationData,
    updateBortleScale,
    resetUpdateState
  );

  useLocationNameTranslation({
    locationData,
    setLocationData,
    setCachedData,
    getCachedData
  });

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
