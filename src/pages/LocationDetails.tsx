
// Refactored to use new hooks and smaller components with improved loading
import React, { useEffect, useRef, useState } from "react";
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
import { getSavedLocation } from "@/utils/locationStorage";

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
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  // Check if we need to load saved location data
  useEffect(() => {
    // If there's no state in the location object, try to get saved location
    if (!location.state && id) {
      const savedLocation = getSavedLocation();
      if (savedLocation) {
        console.log("Using saved location data:", savedLocation);
        // Navigate to the same URL but with state
        navigate(`/location/${id}`, { 
          state: {
            ...savedLocation,
            fromNavBar: true
          },
          replace: true // Replace to avoid extra history entries
        });
      }
    }
  }, [id, location.state, navigate]);

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
    setLoadingCurrentLocation: setLocationLoading
  } = useLocationDetailsLogic({ id, location, navigate, t, setCachedData, getCachedData });

  // Set the loading state properly
  useEffect(() => {
    setLocationLoading(loadingCurrentLocation);
  }, [loadingCurrentLocation, setLocationLoading]);

  // Use the extracted hook for location name translation
  useLocationNameTranslation({
    locationData,
    setLocationData,
    setCachedData,
    getCachedData
  });

  // Show a random astronomy fact as a toast when this page opens
  // Use the ref to ensure it only shows once
  useEffect(() => {
    if (toastShownRef.current) return;
    
    const tip = getRandomAstronomyTip();
    if (!tip) return;
    
    const tipText = language === "zh" ? tip[1] : tip[0];
    
    // Delay toast to avoid blocking initial render
    const timer = setTimeout(() => {
      toast.info(tipText, {
        duration: 6000,
        position: "bottom-right",
      });
      toastShownRef.current = true;
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [language]);

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
          onUseCurrentLocation={() => setLoadingCurrentLocation(true)}
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
