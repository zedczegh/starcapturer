import React, { useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useLocationNameTranslation } from "@/hooks/location/useLocationNameTranslation";
import { prefetchLocationData, prefetchPopularLocations } from "@/lib/queryPrefetcher";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsLoading from "@/components/location/LocationDetailsLoading";
import LocationErrorSection from "@/components/location/LocationErrorSection";
import LocationDetailsMain from "@/components/location/LocationDetailsMain";
import { useLocationDetailsLogic } from "@/hooks/location/useLocationDetailsLogic";
import { toast } from "sonner";
import { getRandomAstronomyTip } from "@/utils/astronomyTips"; 
import NavBar from "@/components/NavBar";
import { useAstronomyTips } from '@/hooks/useAstronomyTips';

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCachedData, getCachedData } = useLocationDataCache();
  const { t, language } = useLanguage();
  // Add a ref to track if the toast has been shown
  const toastShownRef = useRef(false);
  const initialLoadCompleteRef = useRef(false);

  // Prefetch popular locations data when page loads
  useEffect(() => {
    if (!initialLoadCompleteRef.current) {
      initialLoadCompleteRef.current = true;
      // Prefetch popular locations to make navigation faster
      prefetchPopularLocations(queryClient);
    }
  }, [queryClient]);

  // New logic hook
  const {
    locationData,
    setLocationData,
    statusMessage,
    messageType,
    setStatusMessage,
    handleUpdateLocation,
    isLoading,
    loadingCurrentLocation,
    setLoadingCurrentLocation
  } = useLocationDetailsLogic({ id, location, navigate, t, setCachedData, getCachedData });

  // Use the extracted hook for location name translation
  useLocationNameTranslation({
    locationData,
    setLocationData,
    setCachedData,
    getCachedData
  });

  const { showTip } = useAstronomyTips();
  
  // Show a tip when the page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      showTip();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [showTip]);

  // Reset the toast shown ref when the page is unmounted and remounted (navigation)
  useEffect(() => {
    return () => {
      toastShownRef.current = false;
    };
  }, [id]);

  // Preload data for the current location
  useEffect(() => {
    if (locationData?.latitude && locationData?.longitude) {
      prefetchLocationData(queryClient, locationData.latitude, locationData.longitude);
    }
  }, [locationData?.latitude, locationData?.longitude, queryClient]);

  if (isLoading) {
    return <LocationDetailsLoading />;
  }

  return (
    <>
      <NavBar />
      {!locationData ? (
        <LocationErrorSection 
          onUseCurrentLocation={() => {}}
          isLoading={loadingCurrentLocation}
        />
      ) : (
        <LocationDetailsMain
          locationData={locationData}
          setLocationData={setLocationData}
          statusMessage={statusMessage}
          messageType={messageType}
          setStatusMessage={setStatusMessage}
          handleUpdateLocation={handleUpdateLocation}
        />
      )}
    </>
  );
};

export default LocationDetails;
