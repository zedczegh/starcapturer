
import { useEffect, useRef, useState } from 'react';
import { getCurrentPosition } from "@/utils/geolocationUtils";
import { toast } from "sonner";

export const useLocationInitializer = (
  locationData: any,
  isLoading: boolean,
  navigate: (path: string, options: any) => void,
  t: (en: string, zh: string) => string
) => {
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const locationInitializedRef = useRef(false);

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

  return {
    loadingCurrentLocation,
    handleUseCurrentLocation
  };
};
