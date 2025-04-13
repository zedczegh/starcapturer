
import React, { Suspense, lazy, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLocationDetailsData } from "@/hooks/location/useLocationDetailsData";
import NavBar from "@/components/NavBar";
import PageLoader from "@/components/loaders/PageLoader";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// Lazy-loaded components for better performance
const LocationError = lazy(() => import("@/components/location/LocationError"));
const LocationDetailsViewport = lazy(() => import("@/components/location/LocationDetailsViewport"));

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  useEffect(() => {
    // Log what data we received for debugging
    console.log("Location Details Page - ID from params:", id);
    console.log("Location Details Page - State received:", location.state);
    
    // If no state was passed but we have an ID, try to get it from localStorage
    if (!location.state && id) {
      try {
        const storedData = localStorage.getItem(`location_${id}`);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log("Found location data in localStorage:", parsedData);
          navigate(`/location/${id}`, { state: parsedData, replace: true });
          return;
        } else {
          console.error(`No location data found in localStorage for ID: ${id}`);
        }
      } catch (e) {
        console.error("Failed to retrieve location data from localStorage", e);
        toast.error(t("Failed to load location data", "无法加载位置数据"));
      }
    }
  }, [id, location.state, navigate, t]);
  
  const {
    locationData, 
    setLocationData, 
    statusMessage, 
    messageType, 
    setStatusMessage,
    handleUpdateLocation,
    isLoading
  } = useLocationDetailsData(id, location.state);

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
          handleUpdateLocation={handleUpdateLocation}
        />
      </Suspense>
    </>
  );
};

export default LocationDetails;
