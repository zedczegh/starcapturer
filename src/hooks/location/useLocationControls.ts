
import { useState, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { useToast } from "@/hooks/use-toast";
import { useLocationDataCache } from "@/hooks/useLocationData";

interface UseLocationControlsProps {
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  currentLocation?: { latitude: number; longitude: number; name: string } | null;
}

export const useLocationControls = ({
  onLocationUpdate,
  currentLocation
}: UseLocationControlsProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { setCachedData, getCachedData } = useLocationDataCache();
  const [gettingUserLocation, setGettingUserLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [lastTranslationRequest, setLastTranslationRequest] = useState<string | null>(null);
  const [isProcessingLanguageChange, setIsProcessingLanguageChange] = useState(false);

  // Avoid unnecessary effect runs on initial mount
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Create a debounced translation request key
  const translationRequestKey = useCallback(() => {
    if (!currentLocation) return null;
    return `${currentLocation.latitude.toFixed(4)}-${currentLocation.longitude.toFixed(4)}-${language}`;
  }, [currentLocation, language]);

  // Update location name when language changes, only for non-special locations
  useEffect(() => {
    if (!isMounted || !currentLocation || isProcessingLanguageChange) return;
    
    const currentRequestKey = translationRequestKey();
    
    // Skip if we've already processed this exact request
    if (currentRequestKey === lastTranslationRequest) return;
    
    // Skip special locations like Beijing
    if (currentLocation.name === "北京" || currentLocation.name === "Beijing") return;
    
    const updateLocationNameOnLanguageChange = async () => {
      try {
        setIsProcessingLanguageChange(true);
        const locationName = await getLocationNameForCoordinates(
          currentLocation.latitude,
          currentLocation.longitude,
          language,
          { setCachedData, getCachedData }
        );
        
        // Only update if the name changed to avoid unnecessary re-renders
        if (locationName && locationName !== currentLocation.name) {
          await onLocationUpdate({
            name: locationName,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          });
        }
        
        // Update the last translation request to prevent duplicates
        setLastTranslationRequest(currentRequestKey);
      } catch (error) {
        console.error("Error updating location name on language change:", error);
      } finally {
        setIsProcessingLanguageChange(false);
      }
    };
    
    updateLocationNameOnLanguageChange();
  }, [translationRequestKey, currentLocation, onLocationUpdate, setCachedData, getCachedData, isMounted, language, lastTranslationRequest, isProcessingLanguageChange]);

  // Handle the location search
  const handleLocationSearch = useCallback((selectedLocation: { 
    name: string; 
    latitude: number; 
    longitude: number;
    placeDetails?: string;
  }) => {
    try {
      const locationName = selectedLocation.name || 
        `${t("Location at", "位置在")} ${selectedLocation.latitude.toFixed(4)}°, ${selectedLocation.longitude.toFixed(4)}°`;
      
      onLocationUpdate({
        name: locationName,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });
      
      // Reset last translation request when manually selecting a location
      setLastTranslationRequest(null);
      
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

    setGettingUserLocation(true);
    setStatusMessage(t("Retrieving location data...", "正在获取位置数据..."));

    const locationTimeout = setTimeout(() => {
      if (gettingUserLocation) {
        setGettingUserLocation(false);
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
          
          // Reset last translation request when getting current location
          setLastTranslationRequest(`${latitude.toFixed(4)}-${longitude.toFixed(4)}-${language}`);
          
          setStatusMessage(t("Using your current location.", "使用您的当前位置。"));
          
          setTimeout(() => setStatusMessage(null), 3000);
        } catch (error) {
          console.error("Error getting current location:", error);
          setStatusMessage(t("Failed to get your current location.", "无法获取您的当前位置。"));
        } finally {
          setGettingUserLocation(false);
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
        setGettingUserLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [t, setStatusMessage, gettingUserLocation, onLocationUpdate, language, setCachedData, getCachedData]);

  return {
    gettingUserLocation,
    statusMessage,
    setStatusMessage,
    handleLocationSearch,
    handleGetCurrentLocation
  };
};
