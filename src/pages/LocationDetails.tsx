
// Refactored to use new hooks and smaller components with improved loading
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
import { getCurrentPosition } from "@/utils/geolocationUtils";
import { getLocationInfo } from "@/data/locationDatabase";

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

  // If we don't have locationData and we're not loading or already loading the current location,
  // automatically get the user's current location
  useEffect(() => {
    if (!id && !locationData && !isLoading && !loadingCurrentLocation) {
      // Use the current location if no specific location is requested
      setLoadingCurrentLocation(true);
      setStatusMessage(t("Getting your current location...", "正在获取您的位置..."));
      
      getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Use our project location database to get the best estimate for this point
          const locationInfo = getLocationInfo(latitude, longitude);
          const locationId = `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
          
          const locationData = {
            id: locationId,
            name: locationInfo.formattedName || t("Current Location", "当前位置"),
            latitude,
            longitude,
            bortleScale: locationInfo.bortleScale || 5,
            timestamp: new Date().toISOString(),
            siqsResult: { score: 5 } // Default SIQS score to ensure UI shows something
          };
          
          navigate(`/location/${locationId}`, { 
            state: locationData,
            replace: true 
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setStatusMessage(t("Could not get your location. Please check browser permissions.", 
                      "无法获取您的位置。请检查浏览器权限。"));
          setLoadingCurrentLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [id, locationData, isLoading, loadingCurrentLocation, navigate, setLoadingCurrentLocation, setStatusMessage, t]);

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
