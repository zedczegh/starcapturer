
import React, { Suspense, lazy, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLocationDataManager } from "@/hooks/location/useLocationDataManager";
import PageLoader from "@/components/loaders/PageLoader";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useLocationNameTranslation } from "@/hooks/location/useLocationNameTranslation";

// Lazy-loaded components for better performance
const LocationError = lazy(() => import("@/components/location/LocationError"));
const LocationDetailsViewport = lazy(() => import("@/components/location/LocationDetailsViewport"));

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setCachedData, getCachedData } = useLocationDataCache();
  
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

  // Handle back navigation to ensure clean return to home page
  useEffect(() => {
    const handleBackNavigation = () => {
      // We navigate directly to home rather than going back
      navigate("/", { replace: true });
    };

    // Use the popstate event to detect browser back button
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

  // Make sure we have Bortle scale data
  useEffect(() => {
    const updateBortleScale = async () => {
      if (locationData && !isLoading && 
          (locationData.bortleScale === null || locationData.bortleScale === undefined)) {
        
        try {
          const { fetchLightPollutionData } = await import("@/lib/api");
          const pollution = await fetchLightPollutionData(
            locationData.latitude, 
            locationData.longitude
          );
          
          if (pollution && typeof pollution.bortleScale === 'number') {
            setLocationData({
              ...locationData,
              bortleScale: pollution.bortleScale
            });
          }
        } catch (error) {
          console.error("Failed to update Bortle scale:", error);
        }
      }
    };
    
    updateBortleScale();
  }, [locationData, isLoading, setLocationData]);

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
