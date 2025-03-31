
import { useState, useCallback } from "react";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { saveLocation } from "@/utils/locationStorage";

export function usePhotoPointsLocationSelector() {
  const { language } = useLanguage();
  const [locationName, setLocationName] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState<{latitude: number; longitude: number} | null>(null);
  
  const { 
    coords, 
    getPosition, 
    loading: geoLoading, 
    error: geoError 
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    language
  });
  
  // The active location is either manually selected or from geolocation
  const activeLocation = manualLocation || coords;
  
  // Handle using current location
  const handleUseCurrentLocation = useCallback(() => {
    setManualLocation(null);
    getPosition();
    toast.info(
      language === 'en' 
        ? 'Getting your current location...' 
        : '正在获取您的当前位置...'
    );
  }, [getPosition, language]);
  
  // Handle selecting a custom location
  const handleLocationSelect = useCallback((location: { 
    name: string; 
    latitude: number; 
    longitude: number;
  }) => {
    setLocationName(location.name);
    setManualLocation({
      latitude: location.latitude, 
      longitude: location.longitude
    });
    
    // Save the location
    saveLocation({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    });
    
    toast.success(
      language === 'en' 
        ? `Selected location: ${location.name}` 
        : `已选择位置：${location.name}`
    );
  }, [language]);
  
  return {
    locationName,
    setLocationName,
    activeLocation,
    geoLoading,
    geoError,
    handleUseCurrentLocation,
    handleLocationSelect,
    isUsingGeolocation: !manualLocation
  };
}
