
import React, { Suspense, lazy, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLocationDataManager } from "@/hooks/location/useLocationDataManager";
import PageLoader from "@/components/loaders/PageLoader";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { useLocationDataCache } from "@/hooks/useLocationData";

// Lazy-loaded components for better performance
const LocationError = lazy(() => import("@/components/location/LocationError"));
const LocationDetailsViewport = lazy(() => import("@/components/location/LocationDetailsViewport"));

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { setCachedData, getCachedData } = useLocationDataCache();
  
  const {
    locationData, 
    setLocationData, 
    statusMessage, 
    messageType, 
    setStatusMessage,
    handleUpdateLocation,
    isLoading
  } = useLocationDataManager({ id, initialState: location.state, navigate });

  // Update location name when language changes
  useEffect(() => {
    const updateLocationNameForLanguage = async () => {
      if (!locationData || !locationData.latitude || !locationData.longitude) return;
      
      try {
        const newName = await getLocationNameForCoordinates(
          locationData.latitude, 
          locationData.longitude, 
          language, 
          { setCachedData, getCachedData }
        );
        
        if (newName !== locationData.name) {
          setLocationData(prevData => {
            if (!prevData) return null;
            return {
              ...prevData,
              name: newName
            };
          });
        }
      } catch (error) {
        console.error("Error updating location name for language change:", error);
      }
    };
    
    if (locationData) {
      updateLocationNameForLanguage();
    }
  }, [language, locationData, setLocationData, setCachedData, getCachedData]);

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
