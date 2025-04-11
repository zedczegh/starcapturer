
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { Language } from "@/services/geocoding/types";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

interface UseLocationSelectorStateProps {
  language: Language;
  noAutoLocationRequest: boolean;
  bortleScale: number | null;
  setBortleScale: (bortleScale: number | null) => void;
  setStatusMessage: (message: string | null) => void;
  setShowAdvancedSettings: (show: boolean) => void;
  getCachedData: (key: string) => any;
  setCachedData: (key: string, data: any) => void;
}

export const useLocationSelectorState = (props: UseLocationSelectorStateProps) => {
  const { 
    language,
    noAutoLocationRequest,
    bortleScale,
    setBortleScale,
    setStatusMessage,
    setShowAdvancedSettings,
    getCachedData,
    setCachedData
  } = props;
  
  const [locationName, setLocationName] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  
  // Get user geolocation
  const { getPosition, coords } = useGeolocation({
    enableHighAccuracy: true,
    skipPermissionRequest: noAutoLocationRequest
  });
  
  // Use current location
  const handleUseCurrentLocation = useCallback(async () => {
    setStatusMessage("Getting your location...");
    
    try {
      await getPosition();
      
      if (!coords) {
        // Check if coords might be loaded after a slight delay
        setTimeout(async () => {
          if (coords) {
            await handleCurrentLocationSuccess(coords.latitude, coords.longitude);
          } else {
            setStatusMessage("Could not get your location. Please try again.");
            toast.error("Location access denied or unavailable");
          }
        }, 1000);
        return;
      }
      
      await handleCurrentLocationSuccess(coords.latitude, coords.longitude);
    } catch (err) {
      console.error("Error getting location:", err);
      setStatusMessage("Could not get your location. Please try again.");
      toast.error("Location access denied or unavailable");
    }
  }, [getPosition, coords, setStatusMessage]);
  
  // Handle success getting current location
  const handleCurrentLocationSuccess = useCallback(async (lat: number, lng: number) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    
    try {
      // Get location name
      const name = await getLocationNameForCoordinates(lat, lng, language, {
        getCachedData,
        setCachedData
      });
      
      if (name) {
        setLocationName(name);
        setStatusMessage("Location found");
      } else {
        setLocationName(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (err) {
      console.error("Error getting location name:", err);
      setLocationName(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, [language, setStatusMessage, getCachedData, setCachedData]);
  
  // Handle manual location select
  const handleLocationSelect = useCallback((place: any) => {
    if (!place) return;
    
    setLocationName(place.name || "");
    
    if (place.latitude && place.longitude) {
      setLatitude(place.latitude.toString());
      setLongitude(place.longitude.toString());
    }
    
    if (place.bortleScale) {
      setBortleScale(place.bortleScale);
    }
    
    setStatusMessage(null);
  }, [setBortleScale, setStatusMessage]);
  
  // Handle selection of a recommended point
  const handleRecommendedPointSelect = useCallback((point: SharedAstroSpot) => {
    if (!point) return;
    
    const name = point.name || 
                (point.latitude && point.longitude 
                  ? `Location at ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}` 
                  : "");
    
    setLocationName(name);
    
    if (point.latitude !== undefined && point.longitude !== undefined) {
      setLatitude(point.latitude.toString());
      setLongitude(point.longitude.toString());
      
      if (point.bortleScale) {
        setBortleScale(point.bortleScale);
      }
      
      // Show settings since we're selecting a specific location
      setShowAdvancedSettings(false);
      
      setStatusMessage(null);
    }
  }, [setBortleScale, setShowAdvancedSettings, setStatusMessage]);
  
  return {
    userLocation: coords ? { latitude: coords.latitude, longitude: coords.longitude } : null,
    locationName,
    latitude,
    longitude,
    bortleScale,
    setLocationName,
    setLatitude,
    setLongitude,
    setBortleScale,
    handleUseCurrentLocation,
    handleLocationSelect,
    handleRecommendedPointSelect
  };
};
