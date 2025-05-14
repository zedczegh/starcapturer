
import { useState, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { useToast } from "@/hooks/use-toast";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useLocationNameTranslator } from "./useLocationNameTranslator";

interface UseLocationControlsProps {
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  currentLocation?: { latitude: number; longitude: number; name: string } | null;
  setGettingUserLocation?: (state: boolean) => void;
}

export const useLocationControls = ({
  onLocationUpdate,
  currentLocation,
  setGettingUserLocation
}: UseLocationControlsProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { setCachedData, getCachedData } = useLocationDataCache();
  const [gettingUserLocation, setGettingUserLocationInternal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Use the setter function from props if provided, otherwise use the internal state
  const setGettingLocationState = useCallback((state: boolean) => {
    if (setGettingUserLocation) {
      setGettingUserLocation(state);
    } else {
      setGettingUserLocationInternal(state);
    }
  }, [setGettingUserLocation]);

  // Get language translation utils
  const {
    updateLocationNameForLanguage,
    createTranslationRequestKey
  } = useLocationNameTranslator({
    onLocationUpdate,
    setCachedData, 
    getCachedData
  });

  // Avoid unnecessary effect runs on initial mount
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Update location name when language changes, only for non-special locations
  useEffect(() => {
    if (!isMounted || !currentLocation) return;
    updateLocationNameForLanguage(currentLocation);
  }, [currentLocation, updateLocationNameForLanguage, isMounted, language]);

  // Handle the location search
  const handleLocationSearch = useCallback((selectedLocation: { 
    name: string; 
    latitude: number; 
    longitude: number;
    placeDetails?: string;
  }) => {
    try {
      // Check if this looks like raw coordinates
      const isCoordinates = selectedLocation.name.includes(',') && 
                           /^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/.test(selectedLocation.name);
      
      const locationName = isCoordinates ? 
        `${t("Location at", "位置在")} ${selectedLocation.latitude.toFixed(4)}°, ${selectedLocation.longitude.toFixed(4)}°` :
        selectedLocation.name || `${t("Location at", "位置在")} ${selectedLocation.latitude.toFixed(4)}°, ${selectedLocation.longitude.toFixed(4)}°`;
      
      onLocationUpdate({
        name: locationName,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });
      
      setStatusMessage(t(`Now viewing ${locationName}`, `现在查看 ${locationName}`));
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t("Failed to update location", "无法更新位置"));
      toast({
        title: t("Error", "错误"),
        description: t("Failed to update location", "无法更新位置"),
        variant: "destructive"
      });
    }
  }, [onLocationUpdate, t, setStatusMessage, toast]);

  // Get the current location
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatusMessage(t("Geolocation is not supported by your browser.", "您的浏览器不支持地理定位。"));
      return;
    }

    setGettingLocationState(true);
    setStatusMessage(t("Retrieving location data...", "正在获取位置数据..."));

    const locationTimeout = setTimeout(() => {
      if (gettingUserLocation) {
        setGettingLocationState(false);
        setStatusMessage(t("Could not get your location in time. Please try again.", "无法及时获取您的位置。请重试。"));
      }
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(locationTimeout);
        try {
          const { latitude, longitude } = position.coords;
          
          const locationName = await getLocationNameForCoordinates(
            latitude, 
            longitude, 
            language, 
            { setCachedData, getCachedData }
          );
          
          await onLocationUpdate({
            name: locationName,
            latitude,
            longitude
          });
          
          // Save translation request for this location
          const translationKey = createTranslationRequestKey({latitude, longitude});
          
          setStatusMessage(t("Using your current location.", "使用您的当前位置。"));
          
          setTimeout(() => setStatusMessage(null), 3000);
        } catch (error) {
          console.error("Error getting current location:", error);
          setStatusMessage(t("Failed to get your current location.", "无法获取您的当前位置。"));
        } finally {
          setGettingLocationState(false);
        }
      },
      (error) => {
        clearTimeout(locationTimeout);
        console.error("Geolocation error:", error);
        let errorMessage = t("Unknown error occurred.", "发生了未知错误。");
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t("You denied the request for geolocation.", "您拒绝了地理定位请求。");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t("Location information is unavailable.", "位置信息不可用。");
            break;
          case error.TIMEOUT:
            errorMessage = t("The request to get location timed out.", "获取位置请求超时。");
            break;
        }
        
        setStatusMessage(errorMessage);
        setGettingLocationState(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [t, setStatusMessage, gettingUserLocation, onLocationUpdate, language, setCachedData, getCachedData, createTranslationRequestKey, setGettingLocationState]);

  return {
    gettingUserLocation,
    statusMessage,
    setStatusMessage,
    handleLocationSearch,
    handleGetCurrentLocation
  };
};
