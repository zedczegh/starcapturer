
// Refactored to use new hooks and smaller components!
import React, { useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useLocationNameTranslation } from "@/hooks/location/useLocationNameTranslation";
import { prefetchLocationData } from "@/lib/queryPrefetcher";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsLoading from "@/components/location/LocationDetailsLoading";
import LocationErrorSection from "@/components/location/LocationErrorSection";
import LocationDetailsMain from "@/components/location/LocationDetailsMain";
import { useLocationDetailsLogic } from "@/hooks/location/useLocationDetailsLogic";
import { toast } from "sonner";
import { getRandomAstronomyTip } from "@/utils/astronomyTips"; 
import NavBar from "@/components/NavBar";

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCachedData, getCachedData } = useLocationDataCache();
  const { t, language } = useLanguage();
  // Add a ref to track if the toast has been shown
  const toastShownRef = useRef(false);

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

  // Show a random astronomy fact as a toast when this page opens
  // Use the ref to ensure it only shows once
  useEffect(() => {
    if (toastShownRef.current) return;
    
    const tip = getRandomAstronomyTip();
    if (!tip) return;
    
    const tipText = language === "zh" ? tip[1] : tip[0];
    toast.info(tipText, {
      duration: 6000,
      position: "bottom-right",
    });
    
    toastShownRef.current = true;
  }, [language]);

  // Reset the toast shown ref when the page is unmounted and remounted (navigation)
  useEffect(() => {
    return () => {
      toastShownRef.current = false;
    };
  }, [id]);

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
